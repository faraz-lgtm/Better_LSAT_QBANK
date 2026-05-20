-- Student onboarding preferences and official LSAT score history for the dashboard.

create table if not exists public.student_study_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  username text,
  planned_lsat_window text,
  planned_lsat_date date,
  law_school_cycle text,
  goal_score int check (goal_score is null or (goal_score >= 120 and goal_score <= 180)),
  starting_score int check (starting_score is null or (starting_score >= 120 and starting_score <= 180)),
  study_days text[] not null default '{}'::text[],
  study_hours_label text,
  wants_lessons boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.student_study_preferences is 'Onboarding and dashboard study preferences per student.';

create table if not exists public.student_official_lsat_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  test_label text not null,
  test_date date,
  scaled_score int check (scaled_score is null or (scaled_score >= 120 and scaled_score <= 180)),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_official_lsat_scores_user_sort_idx
  on public.student_official_lsat_scores (user_id, sort_order asc, test_date desc nulls last);

comment on table public.student_official_lsat_scores is 'Official LSAT scores entered by the student (not in-app PrepTest practice).';

alter table public.student_study_preferences enable row level security;
alter table public.student_official_lsat_scores enable row level security;

create policy "student_study_preferences_select_own"
  on public.student_study_preferences for select to authenticated
  using (auth.uid() = user_id);

create policy "student_study_preferences_insert_own"
  on public.student_study_preferences for insert to authenticated
  with check (auth.uid() = user_id);

create policy "student_study_preferences_update_own"
  on public.student_study_preferences for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "student_official_lsat_scores_select_own"
  on public.student_official_lsat_scores for select to authenticated
  using (auth.uid() = user_id);

create policy "student_official_lsat_scores_insert_own"
  on public.student_official_lsat_scores for insert to authenticated
  with check (auth.uid() = user_id);

create policy "student_official_lsat_scores_update_own"
  on public.student_official_lsat_scores for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "student_official_lsat_scores_delete_own"
  on public.student_official_lsat_scores for delete to authenticated
  using (auth.uid() = user_id);
