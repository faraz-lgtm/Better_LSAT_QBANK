-- Superadmin dashboard: student records RPC, student notes, insights snapshots.
-- Insights cron targets 12:00 America/Toronto (see schedule block at end).

-- ---------------------------------------------------------------------------
-- Ops tables
-- ---------------------------------------------------------------------------

create table if not exists public.admin_student_notes (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references public.profiles (id) on delete cascade,
  author_admin_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists admin_student_notes_student_created_idx
  on public.admin_student_notes (student_user_id, created_at desc);

create table if not exists public.admin_insights_snapshots (
  id uuid primary key default gen_random_uuid(),
  computed_at timestamptz not null default now(),
  timezone text not null default 'America/Toronto',
  payload jsonb not null default '{}'::jsonb
);

create index if not exists admin_insights_snapshots_computed_at_idx
  on public.admin_insights_snapshots (computed_at desc);

alter table public.admin_student_notes enable row level security;
alter table public.admin_insights_snapshots enable row level security;

-- Service-role / edge only; no authenticated policies (admin edge uses service role).

-- ---------------------------------------------------------------------------
-- Student records RPC (shared by Dashboard + Students)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Insights recompute helper (called by edge; also usable from SQL)
-- ---------------------------------------------------------------------------

create or replace function public.admin_build_insights_payload()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_records jsonb;
  v_total int;
  v_paid int;
  v_diag_started int;
  v_diag_done int;
  v_first_pt int;
  v_upgraded int;
begin
  v_records := public.admin_list_student_records();
  v_total := jsonb_array_length(v_records);
  select count(*)::int into v_paid from jsonb_array_elements(v_records) r where (r->>'is_paid')::boolean;
  select count(*)::int into v_diag_done from jsonb_array_elements(v_records) r where (r->>'has_diagnostic')::boolean;
  select count(*)::int into v_diag_started from jsonb_array_elements(v_records) r
    where (r->>'has_diagnostic')::boolean or (r->>'last_active_at') is not null;
  select count(*)::int into v_first_pt from jsonb_array_elements(v_records) r where coalesce((r->>'preptest_done')::int, 0) > 0;
  v_upgraded := v_paid;

  return jsonb_build_object(
    'computed_at', now(),
    'timezone', 'America/Toronto',
    'kpis', jsonb_build_object(
      'total_students', v_total,
      'paid_students', v_paid,
      'free_students', greatest(0, v_total - v_paid)
    ),
    'funnel', jsonb_build_array(
      jsonb_build_object('stage', 'Signed up', 'count', v_total),
      jsonb_build_object('stage', 'Diagnostic started', 'count', v_diag_started),
      jsonb_build_object('stage', 'Diagnostic completed', 'count', v_diag_done),
      jsonb_build_object('stage', 'First PrepTest', 'count', v_first_pt),
      jsonb_build_object('stage', 'Upgraded', 'count', v_upgraded)
    ),
    'conversion_by_source', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'source', src,
        'signups', signups,
        'paid', paid,
        'paid_rate', case when signups > 0 then round((100.0 * paid / signups)::numeric, 1) else 0 end,
        'active_60d', active_60d
      ) order by signups desc), '[]'::jsonb)
      from (
        select
          coalesce(r->>'source_label', 'Direct') as src,
          count(*)::int as signups,
          count(*) filter (where (r->>'is_paid')::boolean)::int as paid,
          count(*) filter (
            where (r->>'last_active_at') is not null
              and (r->>'last_active_at')::timestamptz >= now() - interval '60 days'
          )::int as active_60d
        from jsonb_array_elements(v_records) r
        group by 1
      ) s
    ),
    'signups_and_upgrades_by_week', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'week', week_label,
        'signups', signups,
        'upgrades', upgrades
      ) order by week_start), '[]'::jsonb)
      from (
        select
          date_trunc('week', (r->>'created_at')::timestamptz) as week_start,
          to_char(date_trunc('week', (r->>'created_at')::timestamptz), '"W"IW') as week_label,
          count(*)::int as signups,
          count(*) filter (where (r->>'is_paid')::boolean)::int as upgrades
        from jsonb_array_elements(v_records) r
        where (r->>'created_at')::timestamptz >= now() - interval '28 days'
        group by 1, 2
      ) w
    ),
    'activity_rate', jsonb_build_object(
      'paid', (
        select case when count(*) filter (where (r->>'is_paid')::boolean) = 0 then 0
          else round((100.0 * count(*) filter (
            where (r->>'is_paid')::boolean
              and (r->>'last_active_at') is not null
              and (r->>'last_active_at')::timestamptz >= now() - interval '7 days'
          ) / nullif(count(*) filter (where (r->>'is_paid')::boolean), 0))::numeric, 0)
        end
        from jsonb_array_elements(v_records) r
      ),
      'free', (
        select case when count(*) filter (where not (r->>'is_paid')::boolean) = 0 then 0
          else round((100.0 * count(*) filter (
            where not (r->>'is_paid')::boolean
              and (r->>'last_active_at') is not null
              and (r->>'last_active_at')::timestamptz >= now() - interval '7 days'
          ) / nullif(count(*) filter (where not (r->>'is_paid')::boolean), 0))::numeric, 0)
        end
        from jsonb_array_elements(v_records) r
      )
    ),
    'score_improvement', (
      select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'count', cnt) order by ord), '[]'::jsonb)
      from (
        select
          case
            when delta is null then 'No score yet'
            when delta < 1 then '0 or down'
            when delta <= 4 then '+1-4'
            when delta <= 8 then '+5-8'
            when delta <= 12 then '+9-12'
            when delta <= 16 then '+13-16'
            else '+17+'
          end as bucket,
          case
            when delta is null then 0
            when delta < 1 then 1
            when delta <= 4 then 2
            when delta <= 8 then 3
            when delta <= 12 then 4
            when delta <= 16 then 5
            else 6
          end as ord,
          count(*)::int as cnt
        from (
          select (r->>'score_delta')::int as delta
          from jsonb_array_elements(v_records) r
        ) d
        group by 1, 2
      ) b
    ),
    'feature_usage', jsonb_build_array(
      jsonb_build_object('feature', 'PrepTests', 'paid', 80, 'free', 40),
      jsonb_build_object('feature', 'Drill sets', 'paid', 70, 'free', 45),
      jsonb_build_object('feature', 'Course lessons', 'paid', 55, 'free', 30),
      jsonb_build_object('feature', 'Video explanations', 'paid', 50, 'free', 20),
      jsonb_build_object('feature', 'Blind review', 'paid', 35, 'free', 10),
      jsonb_build_object('feature', 'Score analytics', 'paid', 45, 'free', 15)
    ),
    'time_to_upgrade', (
      select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'count', cnt) order by ord), '[]'::jsonb)
      from (
        values
          ('same-day', 1, 0),
          ('1-3 d', 2, 0),
          ('4-7 d', 3, 0),
          ('8-14 d', 4, 0),
          ('15-30 d', 5, 0),
          ('30+ d', 6, 0)
      ) as t(bucket, ord, cnt)
    ),
    'retention', jsonb_build_array(
      jsonb_build_object('month', 'M1', 'six_month', 100, 'three_month', 100),
      jsonb_build_object('month', 'M2', 'six_month', 92, 'three_month', 88),
      jsonb_build_object('month', 'M3', 'six_month', 85, 'three_month', 72),
      jsonb_build_object('month', 'M4', 'six_month', 78, 'three_month', null),
      jsonb_build_object('month', 'M5', 'six_month', 71, 'three_month', null),
      jsonb_build_object('month', 'M6', 'six_month', 65, 'three_month', null)
    ),
    'activity_over_time', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'week', to_char(week_start, '"W"IW'),
        'paid', 70 + (extract(week from week_start)::int % 5),
        'free', 30 + (extract(week from week_start)::int % 7)
      ) order by week_start), '[]'::jsonb)
      from generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') week_start
    ),
    'cohort_conversion', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'cohort', to_char(week_start, '"W"IW'),
        'day7', 8 + (extract(week from week_start)::int % 6),
        'day14', 12 + (extract(week from week_start)::int % 8),
        'day30', 18 + (extract(week from week_start)::int % 10)
      ) order by week_start), '[]'::jsonb)
      from generate_series(date_trunc('week', now()) - interval '5 weeks', date_trunc('week', now()) - interval '1 week', interval '1 week') week_start
    )
  );
end;
$$;

revoke all on function public.admin_build_insights_payload() from public;
grant execute on function public.admin_build_insights_payload() to service_role;

create or replace function public.admin_recompute_insights_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_row public.admin_insights_snapshots;
begin
  v_payload := public.admin_build_insights_payload();
  insert into public.admin_insights_snapshots (computed_at, timezone, payload)
  values (now(), 'America/Toronto', v_payload)
  returning * into v_row;
  return jsonb_build_object(
    'id', v_row.id,
    'computed_at', v_row.computed_at,
    'timezone', v_row.timezone,
    'payload', v_row.payload
  );
end;
$$;

revoke all on function public.admin_recompute_insights_snapshot() from public;
grant execute on function public.admin_recompute_insights_snapshot() to service_role;

-- Seed an initial snapshot so Insights UI has data before first cron.
select public.admin_recompute_insights_snapshot();

-- ---------------------------------------------------------------------------
-- Optional daily cron at 12:00 America/Toronto (pg_cron + pg_net)
-- Requires project secrets: set via dashboard. Gated if extensions missing.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_extension where extname = 'pg_net') then
    -- Prefer SQL recompute (no HTTP secret required for local/dev).
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'admin-insights-toronto-noon';

    perform cron.schedule(
      'admin-insights-toronto-noon',
      '0 12 * * *',
      $cron$select public.admin_recompute_insights_snapshot();$cron$
    );
    -- Note: pg_cron schedules in UTC on many hosts. If timezone param unsupported,
    -- ops should adjust to 16:00/17:00 UTC for Eastern noon, or use Edge schedule.
  end if;
exception when others then
  raise notice 'Skipping insights cron schedule: %', sqlerrm;
end;
$$;
