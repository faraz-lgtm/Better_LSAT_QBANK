-- Faster dashboard/overview:
-- 1. Slim section-session rows (no metadata JSON) filtered in SQL.
-- 2. One RPC for overview count aggregates (fewer round trips).
-- 3. Index for in-progress drill lookups.

create or replace function public.list_user_completed_section_sessions_slim(
  p_user_id uuid,
  p_completed_since timestamptz default null
)
returns table (
  id uuid,
  prep_test_id uuid,
  section_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  raw_score integer,
  is_experimental boolean,
  section_type text,
  question_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ps.id,
    ps.prep_test_id,
    ps.section_id,
    ps.started_at,
    ps.completed_at,
    ps.raw_score,
    coalesce(s.is_experimental, false) as is_experimental,
    s.section_type::text as section_type,
    coalesce(s.question_count, 0)::integer as question_count
  from public.practice_sessions ps
  left join public.admin_sections s on s.id = ps.section_id
  left join public.admin_prep_tests pt on pt.id = ps.prep_test_id
  where ps.user_id = p_user_id
    and ps.kind = 'SECTION'
    and ps.completed_at is not null
    and (p_completed_since is null or ps.completed_at >= p_completed_since)
    and public.is_student_visible_prep_test(coalesce(pt.module_id, s.module_id))
  order by ps.completed_at asc;
$$;

comment on function public.list_user_completed_section_sessions_slim(uuid, timestamptz) is
  'Completed SECTION sessions for overview scoring without metadata JSON.';

create or replace function public.user_overview_count_stats(
  p_user_id uuid,
  p_completed_since timestamptz default null
)
returns table (
  total_questions_answered integer,
  drill_correct integer,
  drill_total integer,
  practice_study_minutes integer,
  lesson_study_minutes integer
)
language sql
stable
security definer
set search_path = public
as $$
  with drill as (
    select correct, total
    from public.count_user_visible_drill_answer_events(p_user_id, p_completed_since)
  )
  select
    public.count_user_visible_answer_events(p_user_id, p_completed_since, null),
    (select correct from drill),
    (select total from drill),
    public.sum_user_practice_study_minutes(p_user_id, p_completed_since),
    public.sum_user_lesson_study_minutes(p_user_id, p_completed_since);
$$;

comment on function public.user_overview_count_stats(uuid, timestamptz) is
  'Single round-trip for overview question/drill/study aggregates.';

grant execute on function public.list_user_completed_section_sessions_slim(uuid, timestamptz) to service_role;
grant execute on function public.user_overview_count_stats(uuid, timestamptz) to service_role;

create index if not exists practice_sessions_user_kind_completed_idx
  on public.practice_sessions (user_id, kind, completed_at desc nulls last);

create index if not exists practice_sessions_user_kind_started_incomplete_idx
  on public.practice_sessions (user_id, kind, started_at desc)
  where completed_at is null;
