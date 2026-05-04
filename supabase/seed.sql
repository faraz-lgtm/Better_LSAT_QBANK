-- Optional seed data for `supabase db reset`.

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

-- ---------------------------------------------------------------------------
-- Local dev prep tests: mirror LSAC module ids (LSAC9xx) so admin PrepTests
-- list/dashboard grouping works. Not real LawHub content.
-- ---------------------------------------------------------------------------

insert into public.lsac_content_modules (
  module_id,
  module_name,
  module_type,
  description,
  raw_payload
)
values
  (
    'LSAC900',
    'Local Seed — PrepTest Alpha',
    'PracticeTest',
    'Synthetic module for local Supabase (seed).',
    '{}'::jsonb
  ),
  (
    'LSAC901',
    'Local Seed — PrepTest Beta',
    'PracticeTest',
    'Second synthetic module for admin UI (seed).',
    '{}'::jsonb
  )
on conflict (module_id) do update
set
  module_name = excluded.module_name,
  module_type = excluded.module_type,
  description = excluded.description,
  raw_payload = excluded.raw_payload,
  imported_at = now();

insert into public.admin_prep_tests (module_id, title, imported_at)
values
  ('LSAC900', 'Local Seed — PrepTest Alpha', now()),
  ('LSAC901', 'Local Seed — PrepTest Beta', now())
on conflict (module_id) do update
set
  title = excluded.title,
  imported_at = excluded.imported_at,
  updated_at = now();

-- LSAC900: LR + RC + LG (for section-type filters in admin PrepTests UI)
insert into public.admin_sections (
  prep_test_id,
  module_id,
  section_id,
  section_number,
  section_type,
  title,
  directions
)
select t.id, 'LSAC900', v.section_id, v.section_number, v.section_type::public.admin_section_type, v.title, v.directions
from public.admin_prep_tests t
cross join (
  values
    ('SEED900-LR-1', 1, 'LR', 'Logical Reasoning', 'Answer each question based on the accompanying passage.'),
    ('SEED900-RC-1', 2, 'RC', 'Reading Comprehension', 'Each set of questions is based on a passage or pair of passages.'),
    ('SEED900-LG-1', 3, 'LG', 'Analytical Reasoning', 'Each question is based on a set of conditions.')
) as v(section_id, section_number, section_type, title, directions)
where t.module_id = 'LSAC900'
on conflict (module_id, section_id) do update
set
  prep_test_id = excluded.prep_test_id,
  section_number = excluded.section_number,
  section_type = excluded.section_type,
  title = excluded.title,
  directions = excluded.directions,
  updated_at = now();

-- LSAC901: single LR section
insert into public.admin_sections (
  prep_test_id,
  module_id,
  section_id,
  section_number,
  section_type,
  title,
  directions
)
select t.id, 'LSAC901', 'SEED901-LR-1', 1, 'LR'::public.admin_section_type, 'Logical Reasoning', 'Answer each question based on the accompanying passage.'
from public.admin_prep_tests t
where t.module_id = 'LSAC901'
on conflict (module_id, section_id) do update
set
  prep_test_id = excluded.prep_test_id,
  section_number = excluded.section_number,
  section_type = excluded.section_type,
  title = excluded.title,
  directions = excluded.directions,
  updated_at = now();

-- Sample questions (LR on 900: one “incomplete” for editor flow, one explained)
insert into public.admin_questions (
  section_id,
  source_item_id,
  question_number,
  stimulus_text,
  stem_text,
  choices,
  correct_answer,
  explanation,
  difficulty,
  question_type_id,
  source
)
select s.id, 'seed-900-lr-q1', 1,
  'All books in the library are hardcover. Some hardcovers are worn.',
  'If the statements above are true, which one of the following must be true?',
  '["All books are worn.","Some books are not in the library.","Some worn books are in the library.","No books are hardcover.","Some library books are not worn."]'::jsonb,
  'C',
  null,
  null,
  null,
  'LSAC'::public.question_source
from public.admin_sections s
join public.admin_prep_tests t on t.id = s.prep_test_id and t.module_id = 'LSAC900'
where s.section_id = 'SEED900-LR-1'
on conflict (section_id, source_item_id) do update
set
  question_number = excluded.question_number,
  stimulus_text = excluded.stimulus_text,
  stem_text = excluded.stem_text,
  choices = excluded.choices,
  correct_answer = excluded.correct_answer,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  question_type_id = excluded.question_type_id,
  updated_at = now();

insert into public.admin_questions (
  section_id,
  source_item_id,
  question_number,
  stimulus_text,
  stem_text,
  choices,
  correct_answer,
  explanation,
  difficulty,
  question_type_id,
  source
)
select s.id, 'seed-900-lr-q2', 2,
  'Economists predict that prices will rise next quarter.',
  'The economists'' prediction, if accurate, most strongly supports which one of the following?',
  '["Prices never change.","Prices may rise next quarter.","Prices fell last quarter.","Inflation is impossible.","Demand is irrelevant."]'::jsonb,
  'B',
  'The stimulus only commits to a prediction of rising prices; the modest “may rise” follows directly.',
  2,
  null,
  'LSAC'::public.question_source
from public.admin_sections s
join public.admin_prep_tests t on t.id = s.prep_test_id and t.module_id = 'LSAC900'
where s.section_id = 'SEED900-LR-1'
on conflict (section_id, source_item_id) do update
set
  question_number = excluded.question_number,
  stimulus_text = excluded.stimulus_text,
  stem_text = excluded.stem_text,
  choices = excluded.choices,
  correct_answer = excluded.correct_answer,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  question_type_id = excluded.question_type_id,
  updated_at = now();

insert into public.admin_questions (
  section_id,
  source_item_id,
  question_number,
  stimulus_text,
  stem_text,
  choices,
  correct_answer,
  explanation,
  difficulty,
  question_type_id,
  source
)
select s.id, 'seed-900-rc-q1', 1,
  'Passage A argues that policy X improves outcomes. Passage B questions the evidence for X.',
  'Which one of the following most accurately characterizes a relationship between the two passages?',
  '["They agree on all points.","Passage B challenges a premise used in Passage A.","Passage A summarizes Passage B.","Neither passage discusses policy.","Both passages reject empirical methods."]'::jsonb,
  'B',
  'Passage B targets the strength of evidence underlying a position taken in Passage A.',
  3,
  null,
  'LSAC'::public.question_source
from public.admin_sections s
join public.admin_prep_tests t on t.id = s.prep_test_id and t.module_id = 'LSAC900'
where s.section_id = 'SEED900-RC-1'
on conflict (section_id, source_item_id) do update
set
  question_number = excluded.question_number,
  stimulus_text = excluded.stimulus_text,
  stem_text = excluded.stem_text,
  choices = excluded.choices,
  correct_answer = excluded.correct_answer,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  question_type_id = excluded.question_type_id,
  updated_at = now();

insert into public.admin_questions (
  section_id,
  source_item_id,
  question_number,
  stimulus_text,
  stem_text,
  choices,
  correct_answer,
  explanation,
  difficulty,
  question_type_id,
  source
)
select s.id, 'seed-900-lg-q1', 1,
  'A festival schedules exactly six bands—F, G, H, J, K, L—one per hour from 1pm to 6pm.',
  'If G performs third, and K performs before H, which one of the following could be true?',
  '["L performs first.","H performs second.","J performs sixth.","F performs fourth and L fifth.","K performs sixth."]'::jsonb,
  'D',
  'Work through ordering constraints; only (D) remains consistently possible in at least one valid schedule.',
  4,
  null,
  'LSAC'::public.question_source
from public.admin_sections s
join public.admin_prep_tests t on t.id = s.prep_test_id and t.module_id = 'LSAC900'
where s.section_id = 'SEED900-LG-1'
on conflict (section_id, source_item_id) do update
set
  question_number = excluded.question_number,
  stimulus_text = excluded.stimulus_text,
  stem_text = excluded.stem_text,
  choices = excluded.choices,
  correct_answer = excluded.correct_answer,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  question_type_id = excluded.question_type_id,
  updated_at = now();

insert into public.admin_questions (
  section_id,
  source_item_id,
  question_number,
  stimulus_text,
  stem_text,
  choices,
  correct_answer,
  explanation,
  difficulty,
  question_type_id,
  source
)
select s.id, 'seed-901-lr-q1', 1,
  'If the budget passes, the park will open. The park did not open.',
  'The statements above most strongly support which one of the following?',
  '["The budget passed.","The budget did not pass.","The park will open next year.","The budget is irrelevant to the park.","The park opened briefly."]'::jsonb,
  'B',
  null,
  null,
  null,
  'LSAC'::public.question_source
from public.admin_sections s
join public.admin_prep_tests t on t.id = s.prep_test_id and t.module_id = 'LSAC901'
where s.section_id = 'SEED901-LR-1'
on conflict (section_id, source_item_id) do update
set
  question_number = excluded.question_number,
  stimulus_text = excluded.stimulus_text,
  stem_text = excluded.stem_text,
  choices = excluded.choices,
  correct_answer = excluded.correct_answer,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  question_type_id = excluded.question_type_id,
  updated_at = now();
