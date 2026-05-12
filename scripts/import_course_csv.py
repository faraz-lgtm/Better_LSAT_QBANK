#!/usr/bin/env python3
"""Import flat course+lesson CSV into Supabase prep course tables via psql upserts."""

from __future__ import annotations

import argparse
import csv
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

VALID_LESSON_TYPES = {"video_text", "active_drill", "adaptive_drill", "rep_work"}

REQUIRED_COLUMNS = [
    "course_slug",
    "course_title",
    "course_description",
    "course_is_published",
    "lesson_slug",
    "lesson_title",
    "lesson_type",
    "sort_order",
    "summary",
    "duration_minutes",
    "video_url",
    "text_content",
    "lesson_is_published",
]


@dataclass
class ValidationError:
    line_number: int
    message: str


def parse_bool(value: str) -> bool | None:
    v = (value or "").strip().lower()
    if v in {"true", "t", "1", "yes", "y"}:
        return True
    if v in {"false", "f", "0", "no", "n"}:
        return False
    return None


def validate_csv(csv_path: Path) -> tuple[list[ValidationError], int]:
    errors: list[ValidationError] = []
    row_count = 0

    with csv_path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            errors.append(ValidationError(1, f"Missing required columns: {', '.join(missing)}"))
            return errors, 0

        seen_sort: dict[str, set[int]] = {}
        seen_slug: dict[str, set[str]] = {}

        for idx, row in enumerate(reader, start=2):
            row_count += 1
            course_slug = (row["course_slug"] or "").strip()
            lesson_slug = (row["lesson_slug"] or "").strip()
            lesson_type = (row["lesson_type"] or "").strip()
            text_content = (row["text_content"] or "").strip()
            lesson_title = (row["lesson_title"] or "").strip()
            course_title = (row["course_title"] or "").strip()
            sort_raw = (row["sort_order"] or "").strip()

            if not course_slug:
                errors.append(ValidationError(idx, "course_slug is required"))
            if not course_title:
                errors.append(ValidationError(idx, "course_title is required"))
            if not lesson_slug:
                errors.append(ValidationError(idx, "lesson_slug is required"))
            if not lesson_title:
                errors.append(ValidationError(idx, "lesson_title is required"))
            if lesson_type not in VALID_LESSON_TYPES:
                errors.append(
                    ValidationError(
                        idx,
                        f"lesson_type must be one of {sorted(VALID_LESSON_TYPES)}",
                    )
                )
            if not text_content:
                errors.append(ValidationError(idx, "text_content must be non-empty"))

            try:
                sort_order = int(sort_raw)
                if sort_order <= 0:
                    raise ValueError
            except ValueError:
                errors.append(ValidationError(idx, "sort_order must be an integer > 0"))
                sort_order = None

            if parse_bool(row["course_is_published"]) is None:
                errors.append(ValidationError(idx, "course_is_published must be boolean-like"))
            if parse_bool(row["lesson_is_published"]) is None:
                errors.append(ValidationError(idx, "lesson_is_published must be boolean-like"))

            if sort_order is not None and course_slug:
                seen_sort.setdefault(course_slug, set())
                if sort_order in seen_sort[course_slug]:
                    errors.append(ValidationError(idx, f"duplicate sort_order {sort_order} for course_slug '{course_slug}'"))
                seen_sort[course_slug].add(sort_order)

            if lesson_slug and course_slug:
                seen_slug.setdefault(course_slug, set())
                if lesson_slug in seen_slug[course_slug]:
                    errors.append(ValidationError(idx, f"duplicate lesson_slug '{lesson_slug}' for course_slug '{course_slug}'"))
                seen_slug[course_slug].add(lesson_slug)

    return errors, row_count


def build_import_sql(csv_path: Path) -> str:
    abs_csv = str(csv_path.resolve()).replace("'", "''")
    return f"""
\\set ON_ERROR_STOP 1

begin;

create temp table tmp_course_import_flat (
  course_slug text,
  course_title text,
  course_description text,
  course_is_published text,
  lesson_slug text,
  lesson_title text,
  lesson_type text,
  sort_order text,
  summary text,
  duration_minutes text,
  video_url text,
  text_content text,
  lesson_is_published text,
  source_heading text,
  module_label text
);

\\copy tmp_course_import_flat(course_slug,course_title,course_description,course_is_published,lesson_slug,lesson_title,lesson_type,sort_order,summary,duration_minutes,video_url,text_content,lesson_is_published,source_heading,module_label) from '{abs_csv}' with (format csv, header true, encoding 'UTF8')

insert into public.prep_courses (slug, title, description, is_published)
select distinct
  trim(course_slug),
  trim(course_title),
  nullif(trim(course_description), ''),
  lower(trim(course_is_published)) in ('true','t','1','yes','y')
from tmp_course_import_flat
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  is_published = excluded.is_published,
  updated_at = now();

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
select
  c.id as course_id,
  trim(t.lesson_slug) as slug,
  trim(t.lesson_title) as title,
  trim(t.lesson_type) as lesson_type,
  trim(t.sort_order)::int as sort_order,
  nullif(trim(t.summary), '') as summary,
  nullif(trim(t.duration_minutes), '')::int as duration_minutes,
  nullif(trim(t.video_url), '') as video_url,
  coalesce(nullif(t.text_content, ''), '<p>Imported lesson content.</p>') as text_content,
  lower(trim(t.lesson_is_published)) in ('true','t','1','yes','y') as is_published
from tmp_course_import_flat t
join public.prep_courses c
  on c.slug = trim(t.course_slug)
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

commit;
"""


def run_import(db_url: str, csv_path: Path) -> None:
    sql = build_import_sql(csv_path)
    with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as tmp:
        tmp.write(sql)
        sql_path = Path(tmp.name)
    try:
        subprocess.run(
            ["psql", db_url, "-f", str(sql_path)],
            check=True,
        )
    finally:
        sql_path.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", required=True, type=Path, help="Flat CSV from convert_course_docx.py")
    parser.add_argument("--db-url", required=True, help="Postgres connection URL (local Supabase or remote DB)")
    parser.add_argument("--dry-run", action="store_true", help="Validate only, do not import")
    args = parser.parse_args()

    errors, row_count = validate_csv(args.csv)
    if errors:
        for err in errors[:200]:
            print(f"line {err.line_number}: {err.message}")
        raise SystemExit(f"Validation failed with {len(errors)} error(s).")

    print(f"Validation passed. Rows: {row_count}")
    if args.dry_run:
        print("Dry-run mode enabled. Skipping database import.")
        return

    run_import(args.db_url, args.csv)
    print("Import completed successfully.")


if __name__ == "__main__":
    main()
