-- Student practice sessions and append-only answer events for analytics.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'practice_session_kind') then
    create type public.practice_session_kind as enum ('PREPTEST', 'SECTION', 'DRILL');
  end if;
end $$;

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.practice_session_kind not null,
  prep_test_id uuid references public.admin_prep_tests (id) on delete set null,
  section_id uuid references public.admin_sections (id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  raw_score int,
  scaled_score int,
  percentile int,
  bookmarked boolean not null default false,
  excluded boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists practice_sessions_user_started_idx
  on public.practice_sessions (user_id, started_at desc);

create index if not exists practice_sessions_user_completed_preptest_idx
  on public.practice_sessions (user_id, completed_at desc)
  where kind = 'PREPTEST' and completed_at is not null;

create index if not exists practice_sessions_user_kind_bookmarked_idx
  on public.practice_sessions (user_id, kind, bookmarked);

comment on table public.practice_sessions is 'One row per student practice/test session; mutable for completion, bookmark, exclude.';

create table if not exists public.answer_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  practice_session_id uuid not null references public.practice_sessions (id) on delete cascade,
  question_id uuid not null references public.admin_questions (id) on delete restrict,
  selected_answer text not null,
  is_correct boolean not null,
  question_type_id uuid references public.question_types (id) on delete set null,
  section_type public.admin_section_type,
  difficulty int,
  session_kind public.practice_session_kind not null,
  created_at timestamptz not null default now()
);

create index if not exists answer_events_user_session_idx
  on public.answer_events (user_id, practice_session_id);

create index if not exists answer_events_user_created_idx
  on public.answer_events (user_id, created_at desc);

create index if not exists answer_events_user_type_idx
  on public.answer_events (user_id, question_type_id)
  where question_type_id is not null;

comment on table public.answer_events is 'Append-only denormalized log of each submitted answer for analytics.';

alter table public.practice_sessions enable row level security;
alter table public.answer_events enable row level security;

create policy "practice_sessions_select_own"
  on public.practice_sessions for select to authenticated
  using (auth.uid() = user_id);

create policy "practice_sessions_insert_own"
  on public.practice_sessions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "practice_sessions_update_own"
  on public.practice_sessions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "answer_events_select_own"
  on public.answer_events for select to authenticated
  using (auth.uid() = user_id);

create policy "answer_events_insert_own"
  on public.answer_events for insert to authenticated
  with check (auth.uid() = user_id);
