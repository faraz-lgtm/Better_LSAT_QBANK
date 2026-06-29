-- Lessons imported as video_text but named/slugged as drills should use drill types.
update public.prep_lessons
set
  lesson_type = 'adaptive_drill',
  updated_at = now()
where lesson_type = 'video_text'
  and (
    title ~* '^full drill\b'
    or title ~* '^adaptive drill\b'
    or slug ~* '^full-drill'
    or slug ~* '^adaptive-drill'
  );

update public.prep_lessons
set
  lesson_type = 'active_drill',
  updated_at = now()
where lesson_type = 'video_text'
  and (
    title ~* '^active drill\b'
    or slug ~* '^active-drill'
  );
