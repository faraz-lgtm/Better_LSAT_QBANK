do $$
begin
  if not exists (select 1 from pg_type where typname = 'analysis_segment_type') then
    create type public.analysis_segment_type as enum (
      'thesis',
      'premise',
      'example',
      'counterpoint',
      'rationale',
      'conclusion',
      'other'
    );
  end if;
end $$;

create table if not exists public.admin_passage_analyses (
  id uuid primary key default gen_random_uuid(),
  passage_id uuid not null references public.admin_passages (id) on delete cascade,
  version int not null check (version > 0),
  status text not null check (status in ('draft', 'published')),
  passage_style text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (passage_id, version)
);

create index if not exists admin_passage_analyses_passage_id_idx
  on public.admin_passage_analyses (passage_id);

create table if not exists public.admin_passage_analysis_segments (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.admin_passage_analyses (id) on delete cascade,
  sort_order int not null check (sort_order > 0),
  part_label text not null,
  segment_type public.analysis_segment_type not null,
  title text,
  text_excerpt text not null,
  explanation text not null,
  start_char int,
  end_char int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (analysis_id, sort_order),
  check (
    start_char is null
    or end_char is null
    or start_char <= end_char
  )
);

create index if not exists admin_passage_analysis_segments_analysis_id_idx
  on public.admin_passage_analysis_segments (analysis_id);

create table if not exists public.admin_question_analysis_links (
  id uuid primary key default gen_random_uuid(),
  analysis_segment_id uuid not null references public.admin_passage_analysis_segments (id) on delete cascade,
  question_id uuid not null references public.admin_questions (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (analysis_segment_id, question_id)
);

create index if not exists admin_question_analysis_links_question_id_idx
  on public.admin_question_analysis_links (question_id);

create index if not exists admin_question_analysis_links_segment_id_idx
  on public.admin_question_analysis_links (analysis_segment_id);

alter table public.admin_passage_analyses enable row level security;
alter table public.admin_passage_analysis_segments enable row level security;
alter table public.admin_question_analysis_links enable row level security;

create policy "admin_passage_analyses_select_authenticated"
  on public.admin_passage_analyses for select to authenticated using (true);
create policy "admin_passage_analyses_admin_mutate"
  on public.admin_passage_analyses for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin_passage_analysis_segments_select_authenticated"
  on public.admin_passage_analysis_segments for select to authenticated using (true);
create policy "admin_passage_analysis_segments_admin_mutate"
  on public.admin_passage_analysis_segments for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin_question_analysis_links_select_authenticated"
  on public.admin_question_analysis_links for select to authenticated using (true);
create policy "admin_question_analysis_links_admin_mutate"
  on public.admin_question_analysis_links for all to authenticated using (public.is_admin()) with check (public.is_admin());
