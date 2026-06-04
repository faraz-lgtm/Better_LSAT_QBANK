
create index if not exists answer_events_question_created_idx
  on public.answer_events (question_id, created_at desc);
