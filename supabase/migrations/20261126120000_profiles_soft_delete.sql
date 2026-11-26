-- Soft-delete students: keep profile/auth rows, hide from admin lists + Insights, block login via edge ban.
-- Email stays claimed (signup already-exists warning unchanged).

alter table public.profiles
  add column if not exists deleted_at timestamptz;

comment on column public.profiles.deleted_at is
  'When set, student is soft-deleted (hidden from admin lists/Insights; login banned by edge).';

create index if not exists profiles_deleted_at_null_idx
  on public.profiles (id)
  where deleted_at is null;

create or replace function public.admin_list_student_records()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  with latest_sub as (
    select distinct on (bs.user_id)
      bs.user_id,
      bs.status,
      bs.stripe_price_id,
      bs.plan_tier,
      bs.current_period_start,
      bs.current_period_end,
      bs.cancel_at_period_end,
      bs.updated_at as sub_updated_at
    from public.billing_subscriptions bs
    order by bs.user_id,
      case when bs.status in ('active', 'trialing') then 0 else 1 end,
      bs.updated_at desc
  ),
  last_active as (
    select ae.user_id, max(ae.created_at) as last_active_at
    from public.answer_events ae
    group by ae.user_id
  ),
  latest_preptest as (
    select distinct on (ps.user_id)
      ps.user_id,
      ps.scaled_score as latest_score,
      ps.completed_at as latest_score_at
    from public.practice_sessions ps
    where ps.kind = 'PREPTEST'
      and ps.completed_at is not null
      and ps.scaled_score is not null
    order by ps.user_id, ps.completed_at desc
  ),
  first_preptest as (
    select distinct on (ps.user_id)
      ps.user_id,
      ps.scaled_score as first_preptest_score,
      ps.completed_at as first_preptest_at
    from public.practice_sessions ps
    where ps.kind = 'PREPTEST'
      and ps.completed_at is not null
      and ps.scaled_score is not null
    order by ps.user_id, ps.completed_at asc
  ),
  preptest_counts as (
    select ps.user_id, count(*)::int as preptest_done
    from public.practice_sessions ps
    where ps.kind = 'PREPTEST' and ps.completed_at is not null
    group by ps.user_id
  ),
  score_12d as (
    select
      ps.user_id,
      (array_agg(ps.scaled_score order by ps.completed_at desc))[1] as score_now,
      (array_agg(ps.scaled_score order by ps.completed_at asc))[1] as score_then
    from public.practice_sessions ps
    where ps.kind = 'PREPTEST'
      and ps.completed_at is not null
      and ps.scaled_score is not null
      and ps.completed_at >= now() - interval '12 days'
    group by ps.user_id
    having count(*) >= 2
  ),
  base as (
    select
      p.id,
      p.email,
      coalesce(nullif(trim(p.full_name), ''), nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), p.email) as full_name,
      p.created_at,
      p.stripe_customer_id,
      p.signup_attribution,
      ssp.planned_lsat_date,
      ssp.goal_score,
      ssp.starting_score,
      la.last_active_at,
      ls.status as sub_status,
      ls.stripe_price_id,
      ls.plan_tier,
      ls.current_period_start,
      ls.current_period_end,
      ls.cancel_at_period_end,
      ls.sub_updated_at,
      (ls.status in ('active', 'trialing')) as is_paid,
      case
        when ls.status in ('active', 'trialing') then
          case
            when ls.current_period_start is not null and ls.current_period_end is not null
              and (ls.current_period_end - ls.current_period_start) >= interval '300 days' then '12 mo'
            when ls.current_period_start is not null and ls.current_period_end is not null
              and (ls.current_period_end - ls.current_period_start) >= interval '150 days' then '6 mo'
            when ls.current_period_start is not null and ls.current_period_end is not null
              and (ls.current_period_end - ls.current_period_start) >= interval '60 days' then '3 mo'
            else '1 mo'
          end
        else 'Free'
      end as plan_label,
      case
        when ls.current_period_end is null then null
        else greatest(0, ceil(extract(epoch from (ls.current_period_end - now())) / 86400.0))::int
      end as days_left,
      coalesce(ssp.starting_score, fp.first_preptest_score) as diagnostic_score,
      lp.latest_score,
      pc.preptest_done,
      -- No practice_sessions.is_diagnostic / label columns; use onboarding starting_score or first completed PT.
      (ssp.starting_score is not null or fp.first_preptest_score is not null) as has_diagnostic,
      s12.score_now,
      s12.score_then
    from public.profiles p
    left join public.student_study_preferences ssp on ssp.user_id = p.id
    left join latest_sub ls on ls.user_id = p.id
    left join last_active la on la.user_id = p.id
    left join latest_preptest lp on lp.user_id = p.id
    left join first_preptest fp on fp.user_id = p.id
    left join preptest_counts pc on pc.user_id = p.id
    left join score_12d s12 on s12.user_id = p.id
    where p.role = 'student'
      and p.deleted_at is null
  ),
  enriched as (
    select
      b.*,
      case
        when b.last_active_at is null then 'dormant'
        when b.last_active_at >= now() - interval '2 days' then 'high'
        when b.last_active_at >= now() - interval '7 days' then 'medium'
        else 'dormant'
      end as activity_band,
      case
        when b.last_active_at is null then null
        else greatest(0, floor(extract(epoch from (now() - b.last_active_at)) / 86400.0))::int
      end as days_inactive,
      case
        when b.planned_lsat_date is null then null
        else (b.planned_lsat_date - current_date)
      end as days_to_test,
      case
        when b.signup_attribution ? 'utm_source' then lower(coalesce(b.signup_attribution->>'utm_source', ''))
        when b.signup_attribution ? 'source' then lower(coalesce(b.signup_attribution->>'source', ''))
        else ''
      end as raw_source
    from base b
  ),
  final as (
    select
      e.id,
      e.email,
      e.full_name,
      e.created_at,
      e.stripe_customer_id,
      e.plan_label,
      e.is_paid,
      e.sub_status,
      e.days_left,
      e.cancel_at_period_end,
      e.current_period_end,
      e.planned_lsat_date,
      e.days_to_test,
      e.goal_score,
      e.diagnostic_score,
      e.latest_score,
      case
        when e.diagnostic_score is not null and e.latest_score is not null
          then e.latest_score - e.diagnostic_score
        else null
      end as score_delta,
      coalesce(e.preptest_done, 0) as preptest_done,
      e.last_active_at,
      e.days_inactive,
      e.activity_band,
      case
        when e.raw_source in ('reddit') then 'Reddit'
        when e.raw_source in ('youtube', 'yt') then 'YouTube'
        when e.raw_source in ('referral', 'ref') then 'Referral'
        when e.raw_source in ('google', 'organic', 'seo') or e.raw_source like '%organic%' then 'Organic search'
        when e.raw_source in ('fb', 'facebook', 'meta', 'ig', 'instagram', 'ads', 'paid', 'google_ads')
          or e.raw_source like '%paid%' then 'Paid ads'
        when e.raw_source = '' then 'Direct'
        else initcap(e.raw_source)
      end as source_label,
      e.has_diagnostic,
      (
        e.is_paid
        and (
          coalesce(e.days_inactive, 999) >= 7
          or (e.score_now is not null and e.score_then is not null and e.score_now <= e.score_then - 5)
        )
      ) as at_risk,
      (
        not e.is_paid
        and e.has_diagnostic
        and e.last_active_at is not null
        and e.last_active_at >= now() - interval '7 days'
      ) as upgrade_candidate,
      (not e.has_diagnostic) as never_started_diagnostic,
      (e.days_to_test is not null and e.days_to_test >= 0 and e.days_to_test < 30) as test_date_under_30,
      (
        e.sub_status in ('canceled', 'cancelled')
        and e.sub_updated_at >= date_trunc('month', now())
      ) as cancelled_this_month,
      (e.created_at >= now() - interval '24 hours') as recent_signup_24h,
      case
        when e.is_paid and coalesce(e.days_inactive, 999) >= 7 then 'Inactive 7+ days'
        when e.is_paid and e.score_now is not null and e.score_then is not null and e.score_now < e.score_then
          then format('Score fell %s pts over 12 days', e.score_then - e.score_now)
        when e.is_paid then 'Usage falling'
        else null
      end as risk_why,
      case
        when not e.is_paid and e.has_diagnostic then 'Diagnostic done · active this week'
        else null
      end as upgrade_why
    from enriched e
  )
  select coalesce(jsonb_agg(to_jsonb(f) order by f.created_at desc), '[]'::jsonb)
  into v_result
  from final f;

  return v_result;
end;
$$;
revoke all on function public.admin_list_student_records() from public;
grant execute on function public.admin_list_student_records() to service_role;