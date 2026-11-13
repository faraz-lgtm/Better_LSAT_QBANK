-- Zoom AI Companion meeting summary + session-scoped todos.

alter table public.tutoring_session_artifacts
  add column if not exists summary_json jsonb,
  add column if not exists takeaways jsonb;

comment on column public.tutoring_session_artifacts.summary_json is
  'Raw Zoom meeting summary payload (AI Companion / meeting.summary_completed).';

comment on column public.tutoring_session_artifacts.takeaways is
  'Derived key takeaways (string[]) shown in the transcript viewer.';

create table if not exists public.tutoring_session_todos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tutoring_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  tag text not null default 'Homework'
    check (tag in ('Homework', 'Session prep', 'Review', 'Setup')),
  source text not null default 'user'
    check (source in ('zoom_summary', 'user')),
  done boolean not null default false,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tutoring_session_todos_title_nonempty check (char_length(trim(title)) > 0),
  constraint tutoring_session_todos_session_source_title_key unique (session_id, source, title)
);

comment on table public.tutoring_session_todos is
  'Per-session homework/todos: Zoom next_steps plus user-added tasks.';

create index if not exists tutoring_session_todos_session_created_idx
  on public.tutoring_session_todos (session_id, created_at asc);

create index if not exists tutoring_session_todos_user_idx
  on public.tutoring_session_todos (user_id);

alter table public.tutoring_session_todos enable row level security;

drop policy if exists "tutoring_session_todos_select_own" on public.tutoring_session_todos;
create policy "tutoring_session_todos_select_own"
  on public.tutoring_session_todos
  for select
  to authenticated
  using (auth.uid() = user_id);
