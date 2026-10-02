-- Per-student PrepTest pool membership overrides (Drills / Sections / Full Tests).
-- Sparse: missing row means platform defaults apply for that PrepTest.

create table if not exists public.student_prep_test_pool_overrides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  prep_test_id uuid not null references public.admin_prep_tests (id) on delete cascade,
  in_drills boolean not null,
  in_sections boolean not null,
  in_tests boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, prep_test_id)
);

create index if not exists student_prep_test_pool_overrides_user_idx
  on public.student_prep_test_pool_overrides (user_id);

comment on table public.student_prep_test_pool_overrides is
  'Sparse per-student PrepTest pool membership. Missing rows use platform defaults by PT number.';

alter table public.student_prep_test_pool_overrides enable row level security;

create policy "student_prep_test_pool_overrides_select_own"
  on public.student_prep_test_pool_overrides for select to authenticated
  using (auth.uid() = user_id);

create policy "student_prep_test_pool_overrides_insert_own"
  on public.student_prep_test_pool_overrides for insert to authenticated
  with check (auth.uid() = user_id);

create policy "student_prep_test_pool_overrides_update_own"
  on public.student_prep_test_pool_overrides for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "student_prep_test_pool_overrides_delete_own"
  on public.student_prep_test_pool_overrides for delete to authenticated
  using (auth.uid() = user_id);
