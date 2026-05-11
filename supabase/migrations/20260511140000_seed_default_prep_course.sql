-- Default prep course + lessons for environments that run migrations without seed.sql
-- (e.g. hosted Supabase). Matches supabase/seed.sql prep_* section for slug prep-course.

insert into public.prep_courses (
  slug,
  title,
  description,
  is_published
)
values (
  'prep-course',
  'Prep Course',
  'Foundational LSAT course with mixed video and text lessons.',
  true
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  is_published = excluded.is_published,
  updated_at = now();

with course as (
  select id
  from public.prep_courses
  where slug = 'prep-course'
)
insert into public.prep_lessons (
  course_id,
  slug,
  title,
  lesson_type,
  sort_order,
  summary,
  duration_minutes,
  video_url,
  text_content,
  is_published
)
values
  ((select id from course), 'intro-logical-reasoning', 'Introduction to Logical Reasoning', 'video_text', 1, 'Kickoff and framework for LR study.', 3, 'https://example.com/videos/intro-logical-reasoning', '<p></p>', true),
  ((select id from course), 'main-conclusion-questions', 'Main Conclusion Questions', 'video_text', 2, 'How to identify conclusions quickly.', 52, 'https://example.com/videos/main-conclusion-questions', '<p></p>', true),
  ((select id from course), 'resolve-reconcile-explain', 'Resolve, Reconcile, or Explain Questions', 'video_text', 3, 'Approach for discrepancy-based prompts.', 50, 'https://example.com/videos/resolve-reconcile-explain', '<p></p>', true),
  ((select id from course), 'the-lsat-hard', 'The LSAT Hard?', 'video_text', 4, 'Mindset and expectations for sustained prep.', 2, null, 'I know I just said this, but I want to say it again. The LSAT is hard. I will often remind you that this test is hard, simply to remind you that you need to study to do well. So one more time: The LSAT is hard. You still here? Great, let''s move on.', true),
  ((select id from course), 'spanish-101', 'Spanish 101', 'video_text', 5, 'Example placeholder lesson for module styling.', 45, 'https://example.com/videos/spanish-101', '<p></p>', true),
  ((select id from course), 'is-there-a-better-approach', 'Is there a better approach?', 'video_text', 6, 'Comparing method tradeoffs.', 10, null, 'When deciding between approaches, optimize for accuracy first and speed second. Build consistency through deliberate review.', true)
on conflict (course_id, slug) do update
set
  title = excluded.title,
  lesson_type = excluded.lesson_type,
  sort_order = excluded.sort_order,
  summary = excluded.summary,
  duration_minutes = excluded.duration_minutes,
  video_url = excluded.video_url,
  text_content = excluded.text_content,
  is_published = excluded.is_published,
  updated_at = now();
