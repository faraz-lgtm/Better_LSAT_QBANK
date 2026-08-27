-- Passage-level synthesis HTML from RC authoring CSV (`overall_html`).
alter table public.admin_passage_analyses
  add column if not exists overall_html text;
