-- Course curriculum: prep_courses -> modules -> sections -> lessons

create table public.prep_course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.prep_courses (id) on delete cascade,
  title text not null,
  sort_order int not null check (sort_order > 0),
  duration_minutes int check (duration_minutes is null or duration_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, sort_order),
  check (length(trim(title)) > 0)
);

create table public.prep_course_sections (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.prep_course_modules (id) on delete cascade,
  title text not null,
  sort_order int not null check (sort_order > 0),
  duration_minutes int check (duration_minutes is null or duration_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, sort_order),
  check (length(trim(title)) > 0)
);

create index prep_course_modules_course_id_idx on public.prep_course_modules (course_id);
create index prep_course_sections_module_id_idx on public.prep_course_sections (module_id);

alter table public.prep_lessons
  add column section_id uuid references public.prep_course_sections (id) on delete cascade;

-- Backfill: one default module + section per course that has lessons
do $$
declare
  course_rec record;
  new_module_id uuid;
  new_section_id uuid;
begin
  for course_rec in
    select distinct pl.course_id, pc.title as course_title
    from public.prep_lessons pl
    join public.prep_courses pc on pc.id = pl.course_id
    where pl.section_id is null
  loop
    insert into public.prep_course_modules (course_id, title, sort_order)
    values (course_rec.course_id, coalesce(nullif(trim(course_rec.course_title), ''), 'Module 1'), 1)
    returning id into new_module_id;

    insert into public.prep_course_sections (module_id, title, sort_order)
    values (new_module_id, 'General', 1)
    returning id into new_section_id;

    update public.prep_lessons
    set section_id = new_section_id
    where course_id = course_rec.course_id
      and section_id is null;
  end loop;
end $$;

alter table public.prep_lessons
  alter column section_id set not null;

alter table public.prep_lessons
  drop constraint if exists prep_lessons_course_id_sort_order_key;

alter table public.prep_lessons
  add constraint prep_lessons_section_id_sort_order_key unique (section_id, sort_order);

create index prep_lessons_section_id_idx on public.prep_lessons (section_id);

alter table public.prep_course_modules enable row level security;
alter table public.prep_course_sections enable row level security;

create policy "prep_course_modules_select_published_or_admin"
  on public.prep_course_modules
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.prep_courses c
      where c.id = prep_course_modules.course_id
        and c.is_published = true
    )
  );

create policy "prep_course_modules_insert_admin"
  on public.prep_course_modules
  for insert
  to authenticated
  with check (public.is_admin());

create policy "prep_course_modules_update_admin"
  on public.prep_course_modules
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "prep_course_modules_delete_admin"
  on public.prep_course_modules
  for delete
  to authenticated
  using (public.is_admin());

create policy "prep_course_sections_select_published_or_admin"
  on public.prep_course_sections
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.prep_course_modules m
      join public.prep_courses c on c.id = m.course_id
      where m.id = prep_course_sections.module_id
        and c.is_published = true
    )
  );

create policy "prep_course_sections_insert_admin"
  on public.prep_course_sections
  for insert
  to authenticated
  with check (public.is_admin());

create policy "prep_course_sections_update_admin"
  on public.prep_course_sections
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "prep_course_sections_delete_admin"
  on public.prep_course_sections
  for delete
  to authenticated
  using (public.is_admin());
