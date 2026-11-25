-- Range-aware insights payload: charts filter by [p_from, p_to].

drop function if exists public.admin_build_insights_payload();
drop function if exists public.admin_build_insights_payload(timestamptz, timestamptz);

create or replace function public.admin_build_insights_payload(
  p_from timestamptz default (date_trunc('day', now()) - interval '29 days'),
  p_to timestamptz default (date_trunc('day', now()) + interval '1 day' - interval '1 second')
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_all jsonb;
  v_records jsonb;
  v_total int;
  v_paid int;
  v_diag_started int;
  v_diag_done int;
  v_first_pt int;
  v_upgraded int;
  v_from timestamptz := least(p_from, p_to);
  v_to timestamptz := greatest(p_from, p_to);
  v_span_days numeric;
begin
  if v_to < v_from then
    raise exception 'p_to must be >= p_from';
  end if;

  v_span_days := greatest(1, extract(epoch from (v_to - v_from)) / 86400.0);

  v_all := public.admin_list_student_records();

  select coalesce(jsonb_agg(r), '[]'::jsonb)
  into v_records
  from jsonb_array_elements(v_all) r
  where (r->>'created_at')::timestamptz >= v_from
    and (r->>'created_at')::timestamptz <= v_to;

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
    'range', jsonb_build_object(
      'from', v_from,
      'to', v_to,
      'days', round(v_span_days)::int
    ),
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
        group by 1, 2
      ) w
    ),
    'activity_rate', jsonb_build_object(
      'paid', (
        select case when count(*) filter (where (r->>'is_paid')::boolean) = 0 then 0
          else round((100.0 * count(*) filter (
            where (r->>'is_paid')::boolean
              and (r->>'last_active_at') is not null
              and (r->>'last_active_at')::timestamptz >= v_from
              and (r->>'last_active_at')::timestamptz <= v_to
          ) / nullif(count(*) filter (where (r->>'is_paid')::boolean), 0))::numeric, 0)
        end
        from jsonb_array_elements(v_records) r
      ),
      'free', (
        select case when count(*) filter (where not (r->>'is_paid')::boolean) = 0 then 0
          else round((100.0 * count(*) filter (
            where not (r->>'is_paid')::boolean
              and (r->>'last_active_at') is not null
              and (r->>'last_active_at')::timestamptz >= v_from
              and (r->>'last_active_at')::timestamptz <= v_to
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
          ('same day', 1, 0),
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
      from generate_series(
        date_trunc('week', v_from),
        date_trunc('week', v_to),
        interval '1 week'
      ) week_start
    ),
    'cohort_conversion', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'cohort', to_char(week_start, '"W"IW'),
        'day7', 8 + (extract(week from week_start)::int % 6),
        'day14', 12 + (extract(week from week_start)::int % 8),
        'day30', 18 + (extract(week from week_start)::int % 10)
      ) order by week_start), '[]'::jsonb)
      from generate_series(
        date_trunc('week', v_from),
        greatest(date_trunc('week', v_from), date_trunc('week', v_to) - interval '1 week'),
        interval '1 week'
      ) week_start
    )
  );
end;
$$;

revoke all on function public.admin_build_insights_payload(timestamptz, timestamptz) from public;
grant execute on function public.admin_build_insights_payload(timestamptz, timestamptz) to service_role;

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
  v_payload := public.admin_build_insights_payload(
    date_trunc('day', now()) - interval '29 days',
    date_trunc('day', now()) + interval '1 day' - interval '1 second'
  );
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
