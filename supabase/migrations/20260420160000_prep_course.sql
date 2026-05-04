-- Prep Course internal authoring model (admin-managed).

create table public.prep_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(slug)) > 0),
  check (length(trim(title)) > 0)
);

create table public.prep_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.prep_courses (id) on delete cascade,
  slug text not null,
  title text not null,
  lesson_type text not null check (lesson_type in ('video', 'text')),
  sort_order int not null check (sort_order > 0),
  summary text,
  duration_minutes int check (duration_minutes is null or duration_minutes >= 0),
  video_url text,
  text_content text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  unique (course_id, sort_order),
  check (length(trim(slug)) > 0),
  check (length(trim(title)) > 0),
  check (
    (lesson_type = 'video' and video_url is not null and length(trim(video_url)) > 0)
    or
    (lesson_type = 'text' and text_content is not null and length(trim(text_content)) > 0)
  )
);

create index prep_courses_is_published_idx
  on public.prep_courses (is_published, updated_at desc);

create index prep_lessons_course_id_idx
  on public.prep_lessons (course_id);

create index prep_lessons_published_idx
  on public.prep_lessons (is_published, course_id, sort_order);

alter table public.prep_courses enable row level security;
alter table public.prep_lessons enable row level security;

create policy "prep_courses_select_published_or_admin"
  on public.prep_courses
  for select
  to authenticated
  using (is_published = true or public.is_admin());

create policy "prep_courses_insert_admin"
  on public.prep_courses
  for insert
  to authenticated
  with check (public.is_admin());

create policy "prep_courses_update_admin"
  on public.prep_courses
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "prep_courses_delete_admin"
  on public.prep_courses
  for delete
  to authenticated
  using (public.is_admin());

create policy "prep_lessons_select_published_or_admin"
  on public.prep_lessons
  for select
  to authenticated
  using (
    public.is_admin()
    or (
      is_published = true
      and exists (
        select 1
        from public.prep_courses c
        where c.id = prep_lessons.course_id
          and c.is_published = true
      )
    )
  );

create policy "prep_lessons_insert_admin"
  on public.prep_lessons
  for insert
  to authenticated
  with check (public.is_admin());

create policy "prep_lessons_update_admin"
  on public.prep_lessons
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "prep_lessons_delete_admin"
  on public.prep_lessons
  for delete
  to authenticated
  using (public.is_admin());
