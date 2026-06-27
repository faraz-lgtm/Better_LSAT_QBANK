-- Server-side study time aggregates for dashboard (mirrors web sessionStudyMinutes logic).

create or replace function public.sum_user_practice_study_minutes(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(
    case
      when ps.completed_at is null then 0
      when ps.metadata->>'timing' = '35' then 35
      when ps.metadata->>'timing' = 'per-q' then greatest(1, round(
        coalesce(
          case
            when (ps.metadata->>'questionCount') ~ '^\d+$'
              then (ps.metadata->>'questionCount')::numeric
            else null
          end,
          case
            when jsonb_typeof(ps.metadata->'questionIds') = 'array'
              then jsonb_array_length(ps.metadata->'questionIds')
            else 0
          end
        ) * 80.0 / 60.0
      )::integer)
      when ps.metadata->>'timing' in ('unlimited', '')
        or ps.metadata->>'timing' is null then
        greatest(0, round(extract(epoch from (ps.completed_at - ps.started_at)) / 60.0)::integer)
      when (ps.metadata->>'timing') ~ '^\d+$'
        and (ps.metadata->>'timing')::integer > 0 then
        (ps.metadata->>'timing')::integer
      else 0
    end
  ), 0)::integer
  from public.practice_sessions ps
  where ps.user_id = p_user_id
    and ps.completed_at is not null;
$$;

comment on function public.sum_user_practice_study_minutes(uuid) is
  'Total credited practice minutes for completed sessions (drills, sections, preptests).';

create or replace function public.sum_user_lesson_study_minutes(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(pl.duration_minutes), 0)::integer
  from public.prep_lesson_completions plc
  inner join public.prep_lessons pl on pl.id = plc.lesson_id
  where plc.user_id = p_user_id
    and pl.duration_minutes is not null;
$$;

comment on function public.sum_user_lesson_study_minutes(uuid) is
  'Total minutes from completed prep course lessons.';

grant execute on function public.sum_user_practice_study_minutes(uuid) to service_role;
grant execute on function public.sum_user_lesson_study_minutes(uuid) to service_role;
