-- Student first-paint helpers:
-- 1. Explanation list status counts without loading every catalog question id.
-- 2. Visible PrepTest pool rows (LSAC 100+) without scanning hidden tests.
-- 3. Index for per-user prep-test session lookups.

create or replace function public.explanation_status_counts_for_user(p_user_id uuid)
returns table (
  in_process integer,
  fresh integer,
  answered integer,
  seen integer
)
language sql
stable
security definer
set search_path = public
as $$
  with catalog as (
    select q.id
    from public.admin_questions q
    inner join public.admin_sections s on s.id = q.section_id
    inner join public.admin_prep_tests pt on pt.id = s.prep_test_id
    where public.is_student_visible_prep_test(pt.module_id)
  ),
  progress as (
    select question_id, session_completed
    from public.user_prep_test_question_progress(p_user_id)
  ),
  seen_raw as (
    select distinct jsonb_array_elements_text(coalesce(ps.metadata->'seenQuestionIds', '[]'::jsonb)) as question_id
    from public.practice_sessions ps
    where ps.user_id = p_user_id
      and ps.prep_test_id is not null
      and ps.kind in ('SECTION', 'PREPTEST')
  )
  select
    count(*) filter (
      where p.question_id is not null and p.session_completed is not true
    )::integer as in_process,
    count(*) filter (
      where p.question_id is null and sr.question_id is null
    )::integer as fresh,
    count(*) filter (
      where p.session_completed is true
    )::integer as answered,
    count(*) filter (
      where p.question_id is null and sr.question_id is not null
    )::integer as seen
  from catalog c
  left join progress p on p.question_id = c.id
  left join seen_raw sr on sr.question_id = c.id::text;
$$;

comment on function public.explanation_status_counts_for_user(uuid) is
  'Global explanation list counts without returning catalog question ids.';

create or replace function public.list_visible_prep_test_pool_rows()
returns table (
  id uuid,
  module_id text,
  title text,
  section_id uuid,
  section_type text,
  question_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pt.id,
    pt.module_id,
    pt.title,
    s.id as section_id,
    s.section_type::text,
    coalesce(s.question_count, 0) as question_count
  from public.admin_prep_tests pt
  left join public.admin_sections s on s.prep_test_id = pt.id
  where public.is_student_visible_prep_test(pt.module_id)
  order by pt.module_id;
$$;

comment on function public.list_visible_prep_test_pool_rows() is
  'Student-visible PrepTests (LSAC 100+) with denormalized section counts.';

grant execute on function public.explanation_status_counts_for_user(uuid) to service_role;
grant execute on function public.list_visible_prep_test_pool_rows() to service_role;

create index if not exists practice_sessions_user_prep_test_kind_started_idx
  on public.practice_sessions (user_id, prep_test_id, kind, started_at desc);
