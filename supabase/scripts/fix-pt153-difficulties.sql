-- Fix PT153 question difficulties (1–5) to match provided ratings.
-- Match by LSAC153 module + section_number + question_number.

with target_prep as (
  select id
  from public.admin_prep_tests
  where split_part(module_id, ':', 1) ~* '^LSAC153$'
),
diffs (section_number, question_number, difficulty) as (
  values
    (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 3), (1, 5, 3), (1, 6, 5),
    (1, 7, 1), (1, 8, 3), (1, 9, 3), (1, 10, 3), (1, 11, 5), (1, 12, 3),
    (1, 13, 4), (1, 14, 3), (1, 15, 5), (1, 16, 4), (1, 17, 4), (1, 18, 2),
    (1, 19, 2), (1, 20, 4), (1, 21, 3), (1, 22, 3), (1, 23, 4), (1, 24, 4),
    (1, 25, 3), (1, 26, 3), (1, 27, 3),
    (2, 1, 1), (2, 2, 2), (2, 3, 1), (2, 4, 1), (2, 5, 3), (2, 6, 1),
    (2, 7, 2), (2, 8, 3), (2, 9, 2), (2, 10, 3), (2, 11, 2), (2, 12, 3),
    (2, 13, 2), (2, 14, 2), (2, 15, 3), (2, 16, 4), (2, 17, 3), (2, 18, 5),
    (2, 19, 3), (2, 20, 3), (2, 21, 5), (2, 22, 3), (2, 23, 3), (2, 24, 4),
    (2, 25, 4), (2, 26, 4),
    (3, 1, 2), (3, 2, 1), (3, 3, 2), (3, 4, 2), (3, 5, 3), (3, 6, 2),
    (3, 7, 2), (3, 8, 5), (3, 9, 3), (3, 10, 1), (3, 11, 1), (3, 12, 2),
    (3, 13, 3), (3, 14, 4), (3, 15, 3), (3, 16, 3), (3, 17, 3), (3, 18, 4),
    (3, 19, 3), (3, 20, 4), (3, 21, 3), (3, 22, 5), (3, 23, 3), (3, 24, 3),
    (3, 25, 4), (3, 26, 5),
    (4, 1, 2), (4, 2, 2), (4, 3, 2), (4, 4, 3), (4, 5, 1), (4, 6, 2),
    (4, 7, 5), (4, 8, 3), (4, 9, 2), (4, 10, 2), (4, 11, 3), (4, 12, 2),
    (4, 13, 3), (4, 14, 3), (4, 15, 3), (4, 16, 4), (4, 17, 4), (4, 18, 5),
    (4, 19, 3), (4, 20, 5), (4, 21, 5), (4, 22, 3), (4, 23, 3), (4, 24, 3),
    (4, 25, 4), (4, 26, 5), (4, 27, 5)
),
updated as (
  update public.admin_questions q
  set
    difficulty = d.difficulty,
    updated_at = now()
  from public.admin_sections s
  join target_prep tp on tp.id = s.prep_test_id
  join diffs d on d.section_number = s.section_number
  where q.section_id = s.id
    and q.question_number = d.question_number
  returning
    s.section_number,
    q.question_number,
    q.difficulty
)
select
  count(*)::int as updated_count,
  count(*) filter (where section_number = 1)::int as s1,
  count(*) filter (where section_number = 2)::int as s2,
  count(*) filter (where section_number = 3)::int as s3,
  count(*) filter (where section_number = 4)::int as s4
from updated;
