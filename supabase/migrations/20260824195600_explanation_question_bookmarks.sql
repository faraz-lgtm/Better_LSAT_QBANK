-- Per-student bookmarks for LSAT explanation questions.

create table public.explanation_question_bookmarks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.admin_questions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index explanation_question_bookmarks_user_idx
  on public.explanation_question_bookmarks (user_id, created_at desc);

comment on table public.explanation_question_bookmarks is
  'Student bookmarks for questions on the explanations list.';

alter table public.explanation_question_bookmarks enable row level security;

create policy "explanation_question_bookmarks_select_own"
  on public.explanation_question_bookmarks for select to authenticated
  using (auth.uid() = user_id);

create policy "explanation_question_bookmarks_insert_own"
  on public.explanation_question_bookmarks for insert to authenticated
  with check (auth.uid() = user_id);

create policy "explanation_question_bookmarks_delete_own"
  on public.explanation_question_bookmarks for delete to authenticated
  using (auth.uid() = user_id);
