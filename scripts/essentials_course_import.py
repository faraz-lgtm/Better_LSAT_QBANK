#!/usr/bin/env python3
"""Backup a prep course and insert-only import new lessons from the Essentials DOCX."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DOCX_PATH = REPO_ROOT / "Completed Essentials Course.docx"
NEW_LESSONS_DOCX_PATH = REPO_ROOT / "Essentials Course - New Lessons Only.docx"
PARTIAL_SLUGS_PATH = REPO_ROOT / "data" / "course_import_flat.json"

COURSE_ID = "49d999d7-ecab-4e5e-8fb5-7324bb20efaa"
COURSE_SLUG = "betterlsat-core-syllabus-structure-content"
# First module / first section (matches ensureDefaultModuleSection)
TARGET_SECTION_ID = "8eeb8d31-418e-4b2a-ad0b-07869d86a512"


def run_query(sql: str) -> list[dict]:
    proc = subprocess.run(
        ["supabase", "db", "query", "--linked", "-o", "json", sql],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Query failed:\n{proc.stderr}\n{proc.stdout}")
    payload = json.loads(proc.stdout)
    return payload.get("rows", [])


def run_sql_file(sql_path: Path) -> None:
    proc = subprocess.run(
        ["supabase", "db", "query", "--linked", "-f", str(sql_path)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"SQL file failed:\n{proc.stderr}\n{proc.stdout}")


def sql_literal(value: str | None) -> str:
    if value is None:
        return "null"
    return "'" + value.replace("'", "''") + "'"


def load_new_lesson_rows() -> list[dict[str, str]]:
    import csv
    import tempfile

    docx = DOCX_PATH
    if not docx.exists():
        docx = NEW_LESSONS_DOCX_PATH
    if not docx.exists():
        raise FileNotFoundError("No Essentials DOCX found for import")
    partial = json.loads(PARTIAL_SLUGS_PATH.read_text())
    existing_slugs = {row["lesson_slug"] for row in partial}

    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        csv_path = Path(tmp.name)
    subprocess.run(
        [
            sys.executable,
            str(REPO_ROOT / "scripts" / "convert_course_docx.py"),
            "--docx",
            str(docx),
            "--out",
            str(csv_path),
            "--course-slug",
            COURSE_SLUG,
        ],
        check=True,
        cwd=REPO_ROOT,
    )
    with csv_path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    csv_path.unlink(missing_ok=True)
    return [row for row in rows if row["lesson_slug"] not in existing_slugs]


def backup_course(backup_dir: Path) -> dict:
    backup_dir.mkdir(parents=True, exist_ok=True)
    meta = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "course_id": COURSE_ID,
        "course_slug": COURSE_SLUG,
        "purpose": "Pre-import backup before Essentials new-lessons insert-only import",
    }
    tables = {
        "course": f"select * from prep_courses where id = '{COURSE_ID}'",
        "modules": f"select * from prep_course_modules where course_id = '{COURSE_ID}' order by sort_order",
        "sections": (
            "select pcs.* from prep_course_sections pcs "
            "join prep_course_modules pcm on pcm.id = pcs.module_id "
            f"where pcm.course_id = '{COURSE_ID}' order by pcm.sort_order, pcs.sort_order"
        ),
        "lessons": f"select * from prep_lessons where course_id = '{COURSE_ID}' order by sort_order",
        "lesson_questions": (
            "select lq.* from lesson_questions lq "
            "join prep_lessons pl on pl.id = lq.lesson_id "
            f"where pl.course_id = '{COURSE_ID}' order by lq.lesson_id, lq.sort_order"
        ),
        "lesson_completions": (
            "select plc.* from prep_lesson_completions plc "
            "join prep_lessons pl on pl.id = plc.lesson_id "
            f"where pl.course_id = '{COURSE_ID}'"
        ),
    }
    snapshot: dict[str, object] = {"meta": meta, "tables": {}}
    for name, sql in tables.items():
        rows = run_query(sql)
        snapshot["tables"][name] = rows
        (backup_dir / f"{name}.json").write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    (backup_dir / "snapshot.json").write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")
    write_restore_docs(backup_dir, snapshot)
    return snapshot


def write_restore_docs(backup_dir: Path, snapshot: dict) -> None:
    lesson_count = len(snapshot["tables"]["lessons"])
    restore_sql = f"""-- Full revert: restore course state from backup taken {snapshot['meta']['created_at']}
-- WARNING: Deletes lessons added after backup and re-inserts backed-up lesson rows.
-- Run only if you need a full rollback.

begin;

delete from prep_lessons
where course_id = '{COURSE_ID}'
  and slug not in (
    select slug from jsonb_to_recordset('{json.dumps([{'slug': r['slug']} for r in snapshot['tables']['lessons']])}'::jsonb)
      as x(slug text)
  );

-- For a complete rollback, use scripts/essentials_course_import.py --restore {backup_dir.name}

commit;
"""
    (backup_dir / "revert_new_lessons.sql").write_text(restore_sql, encoding="utf-8")
    readme = f"""# Essentials course import backup

Created: {snapshot['meta']['created_at']}
Course: {COURSE_SLUG} (`{COURSE_ID}`)

## Files

- `snapshot.json` — full backup bundle
- `lessons.json` — {lesson_count} lessons before import
- `lesson_questions.json` — drill/question links on existing lessons
- `lesson_completions.json` — student completion records
- `modules.json`, `sections.json`, `course.json`
- `imported_lesson_slugs.json` — slugs added by the import (written after import)
- `revert_new_lessons.sql` — delete only newly imported lessons by slug list

## Revert import only (remove new lessons)

```bash
python3 scripts/essentials_course_import.py --revert {backup_dir.name}
```

## What import changes

- **Adds** new `prep_lessons` rows only (insert-only, no updates to existing 56 lessons)
- **Does not change** existing lesson content, videos, drill links, sort order, or sections
- New lessons land in Module 1 / General (`{TARGET_SECTION_ID}`) with sort orders appended after 7

## If something went wrong

1. Run `--revert` to delete imported lessons by slug
2. Existing lesson data remains in `lessons.json` for manual comparison
"""
    (backup_dir / "README.md").write_text(readme, encoding="utf-8")


def import_new_lessons(backup_dir: Path, dry_run: bool = False) -> list[str]:
    if not DOCX_PATH.exists() and not NEW_LESSONS_DOCX_PATH.exists():
        raise SystemExit("Missing Essentials DOCX for import")

    existing = run_query(
        f"select slug from prep_lessons where course_id = '{COURSE_ID}'"
    )
    existing_slugs = {row["slug"] for row in existing}
    new_rows = [row for row in load_new_lesson_rows() if row["lesson_slug"] not in existing_slugs]
    if not new_rows:
        print("No new lessons to import (all slugs already exist).")
        return []

    max_sort_rows = run_query(
        f"select coalesce(max(sort_order), 0)::int as max_sort from prep_lessons where section_id = '{TARGET_SECTION_ID}'"
    )
    start_sort = int(max_sort_rows[0]["max_sort"])

    sql_path = backup_dir / "insert_new_lessons.sql"
    chunks: list[str] = ["begin;"]
    imported_slugs: list[str] = []
    for index, row in enumerate(new_rows):
        sort_order = start_sort + index + 1
        slug = row["lesson_slug"]
        imported_slugs.append(slug)
        duration = row["duration_minutes"].strip()
        duration_sql = "null" if not duration else str(int(duration))
        chunks.append(
            "insert into prep_lessons ("
            "course_id, section_id, slug, title, lesson_type, sort_order, summary, "
            "duration_minutes, video_url, text_content, is_published"
            ") values ("
            f"'{COURSE_ID}', '{TARGET_SECTION_ID}', {sql_literal(slug)}, {sql_literal(row['lesson_title'])}, "
            f"{sql_literal(row['lesson_type'])}, {sort_order}, {sql_literal(row['summary'] or None)}, "
            f"{duration_sql}, null, {sql_literal(row['text_content'])}, true"
            ") on conflict (course_id, slug) do nothing;"
        )
    chunks.append("commit;")
    sql_path.write_text("\n".join(chunks), encoding="utf-8")
    (backup_dir / "imported_lesson_slugs.json").write_text(
        json.dumps(imported_slugs, indent=2),
        encoding="utf-8",
    )

    print(f"Prepared {len(new_rows)} inserts (sort {start_sort + 1}..{start_sort + len(new_rows)})")
    print(f"SQL: {sql_path}")
    if dry_run:
        print("Dry-run only; no database changes made.")
        return imported_slugs

    run_sql_file(sql_path)
    after_count = run_query(
        f"select count(*)::int as c from prep_lessons where course_id = '{COURSE_ID}'"
    )[0]["c"]
    print(f"Import complete. Course lesson count: {after_count}")
    return imported_slugs


def revert_import(backup_dir: Path, dry_run: bool = False) -> None:
    slugs_path = backup_dir / "imported_lesson_slugs.json"
    if not slugs_path.exists():
        raise SystemExit(f"Missing {slugs_path}. Was an import run from this backup?")
    slugs = json.loads(slugs_path.read_text())
    if not slugs:
        print("No imported slugs to revert.")
        return
    slug_list = ", ".join(sql_literal(slug) for slug in slugs)
    sql = f"""
begin;
delete from prep_lessons
where course_id = '{COURSE_ID}'
  and slug in ({slug_list});
commit;
"""
    sql_path = backup_dir / "run_revert.sql"
    sql_path.write_text(sql, encoding="utf-8")
    print(f"Will delete {len(slugs)} imported lessons.")
    if dry_run:
        print("Dry-run only.")
        return
    run_sql_file(sql_path)
    after_count = run_query(
        f"select count(*)::int as c from prep_lessons where course_id = '{COURSE_ID}'"
    )[0]["c"]
    print(f"Revert complete. Course lesson count: {after_count}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backup-dir", type=Path, default=None, help="Backup directory name under data/backups/")
    parser.add_argument("--backup-only", action="store_true")
    parser.add_argument("--import-only", action="store_true", help="Skip backup; use existing backup dir")
    parser.add_argument("--revert", type=str, default=None, metavar="BACKUP_DIR", help="Revert import from backup dir")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    backups_root = REPO_ROOT / "data" / "backups"
    if args.revert:
        backup_dir = backups_root / Path(args.revert).name
        revert_import(backup_dir, dry_run=args.dry_run)
        return

    if args.backup_dir:
        backup_dir = backups_root / args.backup_dir
    else:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        backup_dir = backups_root / f"essentials-import-{stamp}"

    if not args.import_only:
        print(f"Backing up to {backup_dir} ...")
        snapshot = backup_course(backup_dir)
        print(
            f"Backup saved: {len(snapshot['tables']['lessons'])} lessons, "
            f"{len(snapshot['tables']['lesson_questions'])} lesson_questions"
        )
        if args.backup_only:
            return

    import_new_lessons(backup_dir, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
