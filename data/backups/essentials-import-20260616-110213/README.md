# Essentials course import backup

Created: 2026-06-16T11:02:13.157418+00:00
Course: betterlsat-core-syllabus-structure-content (`49d999d7-ecab-4e5e-8fb5-7324bb20efaa`)

## Files

- `snapshot.json` — full backup bundle
- `lessons.json` — 56 lessons before import
- `lesson_questions.json` — drill/question links on existing lessons
- `lesson_completions.json` — student completion records
- `modules.json`, `sections.json`, `course.json`
- `imported_lesson_slugs.json` — slugs added by the import (written after import)
- `revert_new_lessons.sql` — delete only newly imported lessons by slug list

## Revert import only (remove new lessons)

```bash
python3 scripts/essentials_course_import.py --revert essentials-import-20260616-110213
```

## Import result (completed)

- **Imported:** 66 new lessons (sort 8–73 in Module 1 / General)
- **Existing:** 56 lessons verified unchanged (title, sort_order, section_id, video_url, lesson_type, text_content)
- **Total lessons now:** 122

## What import changes

- **Adds** new `prep_lessons` rows only (insert-only, no updates to existing 56 lessons)
- **Does not change** existing lesson content, videos, drill links, sort order, or sections
- New lessons land in Module 1 / General (`8eeb8d31-418e-4b2a-ad0b-07869d86a512`) with sort orders appended after 7

## If something went wrong

1. Run `--revert` to delete imported lessons by slug
2. Existing lesson data remains in `lessons.json` for manual comparison
