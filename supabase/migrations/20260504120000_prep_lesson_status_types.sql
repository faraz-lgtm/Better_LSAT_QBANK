-- Replace legacy video/text lesson types with four curriculum status modes:
-- video_text, active_drill, adaptive_drill, rep_work

alter table public.prep_lessons drop constraint prep_lessons_lesson_type_check;
alter table public.prep_lessons drop constraint prep_lessons_check;

-- Legacy "video" lessons often had no HTML body; satisfy the new non-empty text rule.
update public.prep_lessons
set text_content = '<p></p>'
where text_content is null or length(trim(text_content)) = 0;

update public.prep_lessons
set lesson_type = 'video_text'
where lesson_type in ('video', 'text');

alter table public.prep_lessons add constraint prep_lessons_lesson_type_check
  check (
    lesson_type = any (
      array[
        'video_text'::text,
        'active_drill'::text,
        'adaptive_drill'::text,
        'rep_work'::text
      ]
    )
  );

alter table public.prep_lessons add constraint prep_lessons_content_check
  check (text_content is not null and length(trim(text_content)) > 0);
