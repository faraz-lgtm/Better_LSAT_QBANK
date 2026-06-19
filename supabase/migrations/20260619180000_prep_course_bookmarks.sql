-- Per-student prep course module and lesson bookmarks.

create table public.prep_course_module_bookmarks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_id uuid not null references public.prep_course_modules (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

create index prep_course_module_bookmarks_user_idx
  on public.prep_course_module_bookmarks (user_id, created_at desc);

create table public.prep_lesson_bookmarks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.prep_lessons (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index prep_lesson_bookmarks_user_idx
  on public.prep_lesson_bookmarks (user_id, created_at desc);

comment on table public.prep_course_module_bookmarks is 'Student bookmarks for prep course modules.';
comment on table public.prep_lesson_bookmarks is 'Student bookmarks for prep course lessons.';

alter table public.prep_course_module_bookmarks enable row level security;
alter table public.prep_lesson_bookmarks enable row level security;

create policy "prep_course_module_bookmarks_select_own"
  on public.prep_course_module_bookmarks for select to authenticated
  using (auth.uid() = user_id);

create policy "prep_course_module_bookmarks_insert_own"
  on public.prep_course_module_bookmarks for insert to authenticated
  with check (auth.uid() = user_id);

create policy "prep_course_module_bookmarks_delete_own"
  on public.prep_course_module_bookmarks for delete to authenticated
  using (auth.uid() = user_id);

create policy "prep_lesson_bookmarks_select_own"
  on public.prep_lesson_bookmarks for select to authenticated
  using (auth.uid() = user_id);

create policy "prep_lesson_bookmarks_insert_own"
  on public.prep_lesson_bookmarks for insert to authenticated
  with check (auth.uid() = user_id);

create policy "prep_lesson_bookmarks_delete_own"
  on public.prep_lesson_bookmarks for delete to authenticated
  using (auth.uid() = user_id);
