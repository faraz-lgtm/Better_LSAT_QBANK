-- Blind review scores on completed PrepTest sessions (regular scores stay on raw_score / scaled_score).

alter table public.practice_sessions
  add column if not exists blind_review_raw_score int,
  add column if not exists blind_review_scaled_score int,
  add column if not exists blind_review_percentile int,
  add column if not exists blind_review_completed_at timestamptz;

comment on column public.practice_sessions.blind_review_raw_score is 'Re-scored raw total after blind review (latest answer per question).';
comment on column public.practice_sessions.blind_review_scaled_score is 'Scaled score from blind_review_raw_score when score table exists.';
