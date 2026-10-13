-- Student-path query performance:
-- 1. SQL visibility helper + generated explanation/video flags (no HTML over the wire).
-- 2. Analytics / drill / freshness / progress aggregates in Postgres.
-- 3. Indexes for (user_id, session_kind) and (user_id, question_id, created_at).

create or replace function public.is_student_visible_prep_test(p_module_id text)
returns boolean
language sql
immutable
parallel safe
as $$
  select coalesce(
    (
      substring(
        upper(split_part(btrim(coalesce(p_module_id, '')), ':', 1))
        from '^LSAC([0-9]+)$'
      )
    )::integer >= 100,
    false
  );
$$;

comment on function public.is_student_visible_prep_test(text) is
  'True for LSAC PrepTests numbered 100+ (matches TypeScript isStudentVisiblePrepTest).';

alter table public.admin_questions
  add column if not exists has_explanation boolean
  generated always as (length(trim(coalesce(explanation, ''))) > 0) stored;

alter table public.admin_questions
  add column if not exists has_video boolean
  generated always as (length(trim(coalesce(video_url, ''))) > 0) stored;

alter table public.admin_passages
  add column if not exists content_snippet text
  generated always as (
    nullif(
      left(
        btrim(
          regexp_replace(
            regexp_replace(coalesce(content, ''), '<[^>]+>', ' ', 'g'),
            '\s+',
            ' ',
            'g'
          )
        ),
        80
      ),
      ''
    )
  ) stored;

drop function if exists public.admin_prep_test_question_stats(uuid[]);

create or replace function public.admin_prep_test_question_stats(p_prep_test_ids uuid[])
returns table (
  prep_test_id uuid,
  total integer,
  explained integer,
  tagged integer,
  difficulty_set integer,
  explained_or_video integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.prep_test_id,
    count(q.id)::integer as total,
    count(q.id) filter (where q.has_explanation)::integer as explained,
    count(q.id) filter (where q.question_type_id is not null)::integer as tagged,
    count(q.id) filter (where q.difficulty is not null)::integer as difficulty_set,
    count(q.id) filter (where q.has_explanation or q.has_video)::integer as explained_or_video
  from public.admin_sections s
  left join public.admin_questions q on q.section_id = s.id
  where s.prep_test_id = any(p_prep_test_ids)
  group by s.prep_test_id;
$$;

comment on function public.admin_prep_test_question_stats(uuid[]) is
  'Per-prep-test question totals without fetching explanation HTML.';

grant execute on function public.admin_prep_test_question_stats(uuid[]) to service_role;

create or replace function public.count_user_visible_answer_events(
  p_user_id uuid,
  p_completed_since timestamptz default null,
  p_session_kind text default null
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.answer_events ae
  inner join public.admin_questions q on q.id = ae.question_id
  inner join public.admin_sections s on s.id = q.section_id
  left join public.admin_prep_tests pt on pt.id = s.prep_test_id
  where ae.user_id = p_user_id
    and (p_completed_since is null or ae.created_at >= p_completed_since)
    and (
      p_session_kind is null
      or ae.session_kind = p_session_kind::public.practice_session_kind
    )
    and public.is_student_visible_prep_test(coalesce(pt.module_id, s.module_id));
$$;

create or replace function public.count_user_visible_drill_answer_events(
  p_user_id uuid,
  p_completed_since timestamptz default null
)
returns table (
  correct integer,
  total integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where ae.is_correct)::integer as correct,
    count(*)::integer as total
  from public.answer_events ae
  inner join public.admin_questions q on q.id = ae.question_id
  inner join public.admin_sections s on s.id = q.section_id
  left join public.admin_prep_tests pt on pt.id = s.prep_test_id
  where ae.user_id = p_user_id
    and ae.session_kind = 'DRILL'
    and (p_completed_since is null or ae.created_at >= p_completed_since)
    and public.is_student_visible_prep_test(coalesce(pt.module_id, s.module_id));
$$;

create or replace function public.list_user_visible_answer_events_with_types(p_user_id uuid)
returns table (
  question_type_id uuid,
  is_correct boolean,
  question_id uuid,
  session_kind text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ae.question_type_id,
    ae.is_correct,
    ae.question_id,
    ae.session_kind::text
  from public.answer_events ae
  inner join public.admin_questions q on q.id = ae.question_id
  inner join public.admin_sections s on s.id = q.section_id
  left join public.admin_prep_tests pt on pt.id = s.prep_test_id
  left join public.practice_sessions ps on ps.id = ae.practice_session_id
  where ae.user_id = p_user_id
    and ae.question_type_id is not null
    and coalesce(ps.excluded, false) = false
    and public.is_student_visible_prep_test(coalesce(pt.module_id, s.module_id));
$$;

create or replace function public.list_user_visible_answer_events_with_type_difficulty(p_user_id uuid)
returns table (
  question_type_id uuid,
  difficulty integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ae.question_type_id,
    ae.difficulty
  from public.answer_events ae
  inner join public.admin_questions q on q.id = ae.question_id
  inner join public.admin_sections s on s.id = q.section_id
  left join public.admin_prep_tests pt on pt.id = s.prep_test_id
  left join public.practice_sessions ps on ps.id = ae.practice_session_id
  where ae.user_id = p_user_id
    and ae.question_type_id is not null
    and coalesce(ps.excluded, false) = false
    and public.is_student_visible_prep_test(coalesce(pt.module_id, s.module_id));
$$;

create or replace function public.list_user_visible_kind_section_accuracy(
  p_user_id uuid,
  p_session_kind text
)
returns table (
  section_type text,
  is_correct boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ae.section_type::text,
    ae.is_correct
  from public.answer_events ae
  inner join public.admin_questions q on q.id = ae.question_id
  inner join public.admin_sections s on s.id = q.section_id
  left join public.admin_prep_tests pt on pt.id = s.prep_test_id
  where ae.user_id = p_user_id
    and ae.session_kind = p_session_kind::public.practice_session_kind
    and public.is_student_visible_prep_test(coalesce(pt.module_id, s.module_id));
$$;

create or replace function public.latest_answer_summaries_for_user(p_user_id uuid)
returns table (
  question_id uuid,
  is_correct boolean,
  time_spent_seconds integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with latest as (
    select distinct on (ae.question_id)
      ae.question_id,
      ae.is_correct,
      ae.time_spent_seconds,
      ae.created_at
    from public.answer_events ae
    where ae.user_id = p_user_id
    order by ae.question_id, ae.created_at desc
  ),
  timed as (
    select distinct on (ae.question_id)
      ae.question_id,
      ae.time_spent_seconds
    from public.answer_events ae
    where ae.user_id = p_user_id
      and ae.time_spent_seconds is not null
    order by ae.question_id, ae.created_at desc
  )
  select
    latest.question_id,
    latest.is_correct,
    coalesce(latest.time_spent_seconds, timed.time_spent_seconds) as time_spent_seconds,
    latest.created_at
  from latest
  left join timed on timed.question_id = latest.question_id;
$$;

create or replace function public.prep_test_freshness_for_user(p_user_id uuid)
returns table (
  prep_test_id uuid,
  total integer,
  answered integer
)
language sql
stable
security definer
set search_path = public
as $$
  with visible_q as (
    select q.id, s.prep_test_id
    from public.admin_questions q
    inner join public.admin_sections s on s.id = q.section_id
    left join public.admin_prep_tests pt on pt.id = s.prep_test_id
    where s.prep_test_id is not null
      and public.is_student_visible_prep_test(coalesce(pt.module_id, s.module_id))
  ),
  answered as (
    select distinct ae.question_id
    from public.answer_events ae
    where ae.user_id = p_user_id
  )
  select
    visible_q.prep_test_id,
    count(*)::integer as total,
    count(*) filter (where answered.question_id is not null)::integer as answered
  from visible_q
  left join answered on answered.question_id = visible_q.id
  group by visible_q.prep_test_id;
$$;

create or replace function public.list_drill_picker_pool_questions(p_section_type text)
returns table (
  id uuid,
  section_id uuid,
  source_group_id text,
  difficulty integer,
  question_type_id uuid,
  question_number integer,
  prep_test_id uuid,
  module_id text,
  section_number integer,
  tag_label text,
  search_text text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    q.section_id,
    q.source_group_id,
    q.difficulty,
    q.question_type_id,
    q.question_number,
    s.prep_test_id,
    coalesce(pt.module_id, s.module_id) as module_id,
    s.section_number,
    qt.name as tag_label,
    left(
      lower(
        concat_ws(
          ' ',
          coalesce(qt.name, ''),
          regexp_replace(coalesce(q.stem_text, ''), '<[^>]+>', ' ', 'g'),
          regexp_replace(coalesce(q.stimulus_text, ''), '<[^>]+>', ' ', 'g')
        )
      ),
      400
    ) as search_text
  from public.admin_questions q
  inner join public.admin_sections s on s.id = q.section_id
  left join public.admin_prep_tests pt on pt.id = s.prep_test_id
  left join public.question_types qt on qt.id = q.question_type_id
  where s.section_type = p_section_type::public.admin_section_type
    and public.is_student_visible_prep_test(coalesce(pt.module_id, s.module_id));
$$;

create or replace function public.list_lsat_catalog_question_ids()
returns table (id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select q.id
  from public.admin_questions q
  inner join public.admin_sections s on s.id = q.section_id
  inner join public.admin_prep_tests pt on pt.id = s.prep_test_id
  where public.is_student_visible_prep_test(pt.module_id);
$$;

create or replace function public.user_prep_test_question_progress(p_user_id uuid)
returns table (
  question_id uuid,
  session_completed boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (ae.question_id)
    ae.question_id,
    (ps.completed_at is not null) as session_completed
  from public.answer_events ae
  inner join public.practice_sessions ps on ps.id = ae.practice_session_id
  where ae.user_id = p_user_id
    and ps.prep_test_id is not null
    and ps.kind in ('SECTION', 'PREPTEST')
  order by ae.question_id, ae.created_at desc;
$$;

grant execute on function public.is_student_visible_prep_test(text) to service_role;
grant execute on function public.count_user_visible_answer_events(uuid, timestamptz, text) to service_role;
grant execute on function public.count_user_visible_drill_answer_events(uuid, timestamptz) to service_role;
grant execute on function public.list_user_visible_answer_events_with_types(uuid) to service_role;
grant execute on function public.list_user_visible_answer_events_with_type_difficulty(uuid) to service_role;
grant execute on function public.list_user_visible_kind_section_accuracy(uuid, text) to service_role;
grant execute on function public.latest_answer_summaries_for_user(uuid) to service_role;
grant execute on function public.prep_test_freshness_for_user(uuid) to service_role;
grant execute on function public.list_drill_picker_pool_questions(text) to service_role;
grant execute on function public.list_lsat_catalog_question_ids() to service_role;
grant execute on function public.user_prep_test_question_progress(uuid) to service_role;

create index if not exists answer_events_user_kind_created_idx
  on public.answer_events (user_id, session_kind, created_at desc);

create index if not exists answer_events_user_question_created_idx
  on public.answer_events (user_id, question_id, created_at desc);
