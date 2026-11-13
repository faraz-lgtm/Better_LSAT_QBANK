-- Allow free-text category on tutoring session todos (Add Task dialog).

alter table public.tutoring_session_todos
  drop constraint if exists tutoring_session_todos_tag_check;

alter table public.tutoring_session_todos
  add constraint tutoring_session_todos_tag_nonempty
  check (char_length(trim(tag)) > 0);

comment on column public.tutoring_session_todos.tag is
  'Free-text category label (e.g. Homework, Session prep, or custom).';
