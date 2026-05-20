-- Per-student prep course lesson completion tracking.

create table public.prep_lesson_completions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.prep_lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index prep_lesson_completions_user_completed_idx
  on public.prep_lesson_completions (user_id, completed_at desc);

comment on table public.prep_lesson_completions is 'Tracks which prep lessons each student has marked complete.';

alter table public.prep_lesson_completions enable row level security;

create policy "prep_lesson_completions_select_own"
  on public.prep_lesson_completions for select to authenticated
  using (auth.uid() = user_id);

create policy "prep_lesson_completions_insert_own"
  on public.prep_lesson_completions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "prep_lesson_completions_update_own"
  on public.prep_lesson_completions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "prep_lesson_completions_delete_own"
  on public.prep_lesson_completions for delete to authenticated
  using (auth.uid() = user_id);
