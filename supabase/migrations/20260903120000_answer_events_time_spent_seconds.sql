alter table public.answer_events
  add column if not exists time_spent_seconds int;

alter table public.answer_events
  drop constraint if exists answer_events_time_spent_seconds_check;

alter table public.answer_events
  add constraint answer_events_time_spent_seconds_check
  check (time_spent_seconds is null or time_spent_seconds >= 0);

comment on column public.answer_events.time_spent_seconds is
  'Pause-aware dwell seconds on the question at scored submit (SECTION sessions).';
