-- Speed up practice pool lists and admin prep-test stats:
-- 1. Denormalize question counts on admin_sections (avoid nested PostgREST count joins).
-- 2. Aggregate explained/tagged counts in SQL instead of fetching explanation HTML.
-- 3. Index published lessons by section for curriculum lists.

alter table public.admin_sections
  add column if not exists question_count integer not null default 0;

update public.admin_sections s
set question_count = coalesce((
  select count(*)::integer
  from public.admin_questions q
  where q.section_id = s.id
), 0);

create or replace function public.admin_questions_sync_section_question_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.admin_sections
    set question_count = question_count + 1
    where id = new.section_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.admin_sections
    set question_count = greatest(question_count - 1, 0)
    where id = old.section_id;
    return old;
  elsif tg_op = 'UPDATE' and old.section_id is distinct from new.section_id then
    update public.admin_sections
    set question_count = greatest(question_count - 1, 0)
    where id = old.section_id;
    update public.admin_sections
    set question_count = question_count + 1
    where id = new.section_id;
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists admin_questions_sync_section_question_count on public.admin_questions;

create trigger admin_questions_sync_section_question_count
after insert or delete or update of section_id
on public.admin_questions
for each row
execute function public.admin_questions_sync_section_question_count();

create or replace function public.admin_prep_test_question_stats(p_prep_test_ids uuid[])
returns table (
  prep_test_id uuid,
  total integer,
  explained integer,
  tagged integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.prep_test_id,
    count(q.id)::integer as total,
    count(q.id) filter (
      where length(trim(coalesce(q.explanation, ''))) > 0
    )::integer as explained,
    count(q.id) filter (
      where q.question_type_id is not null
    )::integer as tagged
  from public.admin_sections s
  left join public.admin_questions q on q.section_id = s.id
  where s.prep_test_id = any(p_prep_test_ids)
  group by s.prep_test_id;
$$;

comment on function public.admin_prep_test_question_stats(uuid[]) is
  'Per-prep-test question totals without fetching explanation HTML.';

grant execute on function public.admin_prep_test_question_stats(uuid[]) to service_role;

create index if not exists admin_questions_section_id_idx
  on public.admin_questions (section_id);

create index if not exists prep_lessons_section_published_sort_idx
  on public.prep_lessons (section_id, is_published, sort_order);
