-- Super admin MVP schema for taxonomy, question metadata, content curation, and config.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'admin_section_type') then
    create type public.admin_section_type as enum ('LR', 'RC', 'LG');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'question_source') then
    create type public.question_source as enum ('LSAC', 'PLATFORM');
  end if;
end $$;

create table if not exists public.question_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  section_type public.admin_section_type not null,
  avg_per_test numeric,
  goal_accuracy numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_prep_tests (
  id uuid primary key default gen_random_uuid(),
  module_id text not null unique references public.lsac_content_modules (module_id) on delete cascade,
  title text not null,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_sections (
  id uuid primary key default gen_random_uuid(),
  prep_test_id uuid not null references public.admin_prep_tests (id) on delete cascade,
  module_id text not null,
  section_id text not null,
  section_number int not null default 0,
  section_type public.admin_section_type,
  title text,
  directions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, section_id)
);

create index if not exists admin_sections_prep_test_id_idx on public.admin_sections (prep_test_id);

create table if not exists public.admin_passages (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.admin_sections (id) on delete cascade,
  source_group_id text,
  content text,
  topic_tag text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_logic_games (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.admin_sections (id) on delete cascade,
  source_group_id text,
  setup_text text,
  rules_text text,
  game_type_id uuid references public.question_types (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references public.admin_sections (id) on delete cascade,
  source_item_id text,
  source_group_id text,
  question_number int,
  stimulus_text text,
  stem_text text,
  choices jsonb not null default '[]'::jsonb,
  correct_answer text,
  explanation text,
  video_url text,
  difficulty int check (difficulty is null or (difficulty >= 1 and difficulty <= 5)),
  question_type_id uuid references public.question_types (id) on delete set null,
  source public.question_source not null default 'LSAC',
  source_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_id, source_item_id)
);

create index if not exists admin_questions_section_id_idx on public.admin_questions (section_id);
create index if not exists admin_questions_source_idx on public.admin_questions (source);
create index if not exists admin_questions_question_type_idx on public.admin_questions (question_type_id);

create table if not exists public.lesson_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.prep_lessons (id) on delete cascade,
  question_id uuid not null references public.admin_questions (id) on delete cascade,
  sort_order int not null default 1 check (sort_order > 0),
  created_at timestamptz not null default now(),
  unique (lesson_id, question_id),
  unique (lesson_id, sort_order)
);

create index if not exists lesson_questions_lesson_id_idx on public.lesson_questions (lesson_id);
create index if not exists lesson_questions_question_id_idx on public.lesson_questions (question_id);

create table if not exists public.platform_config (
  id text primary key default 'singleton',
  section_time_limit_sec int not null default 2100,
  student_can_toggle_timed boolean not null default true,
  save_time_on_pause boolean not null default true,
  auto_advance_on_timeout boolean not null default true,
  drill_per_question_sec int not null default 85,
  show_elapsed_per_question boolean not null default false,
  blind_review_enabled boolean not null default true,
  blind_review_timed boolean not null default false,
  show_scaled_score boolean not null default true,
  show_raw_score boolean not null default true,
  show_percentile boolean not null default true,
  show_previous_on_retake boolean not null default true,
  you_try_counts_in_score boolean not null default false,
  free_tier_pt_cutoff int not null default 10,
  allow_retakes boolean not null default true,
  show_answer_history_on_retake boolean not null default true,
  retake_analytics_mode text not null default 'BEST',
  min_days_between_retakes int not null default 0,
  max_drill_questions int not null default 50,
  you_try_in_drills boolean not null default true,
  exclude_seen_by_default boolean not null default true,
  drill_explanation_timing text not null default 'IMMEDIATE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_score_tables (
  id uuid primary key default gen_random_uuid(),
  prep_test_id uuid not null unique references public.admin_prep_tests (id) on delete cascade,
  source text not null default 'LAWHUB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_score_rows (
  id uuid primary key default gen_random_uuid(),
  score_table_id uuid not null references public.admin_score_tables (id) on delete cascade,
  raw_score int not null,
  scaled_score int,
  percentile int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (score_table_id, raw_score)
);

create index if not exists admin_score_rows_score_table_id_idx on public.admin_score_rows (score_table_id);

alter table public.question_types enable row level security;
alter table public.admin_prep_tests enable row level security;
alter table public.admin_sections enable row level security;
alter table public.admin_passages enable row level security;
alter table public.admin_logic_games enable row level security;
alter table public.admin_questions enable row level security;
alter table public.lesson_questions enable row level security;
alter table public.platform_config enable row level security;
alter table public.admin_score_tables enable row level security;
alter table public.admin_score_rows enable row level security;

create policy "question_types_select_authenticated"
  on public.question_types for select to authenticated using (true);
create policy "question_types_admin_mutate"
  on public.question_types for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin_prep_tests_select_authenticated"
  on public.admin_prep_tests for select to authenticated using (true);
create policy "admin_prep_tests_admin_mutate"
  on public.admin_prep_tests for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin_sections_select_authenticated"
  on public.admin_sections for select to authenticated using (true);
create policy "admin_sections_admin_mutate"
  on public.admin_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin_passages_select_authenticated"
  on public.admin_passages for select to authenticated using (true);
create policy "admin_passages_admin_mutate"
  on public.admin_passages for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin_logic_games_select_authenticated"
  on public.admin_logic_games for select to authenticated using (true);
create policy "admin_logic_games_admin_mutate"
  on public.admin_logic_games for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin_questions_select_authenticated"
  on public.admin_questions for select to authenticated using (true);
create policy "admin_questions_admin_mutate"
  on public.admin_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "lesson_questions_select_authenticated"
  on public.lesson_questions for select to authenticated using (true);
create policy "lesson_questions_admin_mutate"
  on public.lesson_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "platform_config_select_authenticated"
  on public.platform_config for select to authenticated using (true);
create policy "platform_config_admin_mutate"
  on public.platform_config for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin_score_tables_select_authenticated"
  on public.admin_score_tables for select to authenticated using (true);
create policy "admin_score_tables_admin_mutate"
  on public.admin_score_tables for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin_score_rows_select_authenticated"
  on public.admin_score_rows for select to authenticated using (true);
create policy "admin_score_rows_admin_mutate"
  on public.admin_score_rows for all to authenticated using (public.is_admin()) with check (public.is_admin());
