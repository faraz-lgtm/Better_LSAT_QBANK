#!/usr/bin/env python3
"""Convert BetterLSAT syllabus DOCX into a flat CSV for course import."""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import zipfile
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET

W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

LESSON_PATTERNS = [
    re.compile(r"^module\s+\d+\s*,\s*lesson\s+(\d+)\s*[:\-]\s*(.+)$", re.IGNORECASE),
    re.compile(r"^lesson\s+(\d+)\s*[:\-]\s*(.+)$", re.IGNORECASE),
    re.compile(r"^lesson\s+(\d+)\s+(.+)$", re.IGNORECASE),
]

MODULE_PATTERN = re.compile(r"^module\s+(\d+)\b[:\-]?\s*(.*)$", re.IGNORECASE)
DURATION_PATTERN = re.compile(r"\b(\d{1,3})\s*(?:min|mins|minute|minutes)\b", re.IGNORECASE)


@dataclass
class LessonDraft:
    source_heading: str
    title: str
    body_lines: list[str] = field(default_factory=list)
    module_label: str | None = None
    lesson_number_hint: int | None = None


def normalize_space(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def slugify(value: str) -> str:
    slug = value.lower().strip()
    slug = slug.replace("&", " and ")
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug or "untitled"


def unique_slug(base_slug: str, taken: set[str]) -> str:
    if base_slug not in taken:
        taken.add(base_slug)
        return base_slug
    n = 2
    while f"{base_slug}-{n}" in taken:
        n += 1
    slug = f"{base_slug}-{n}"
    taken.add(slug)
    return slug


def read_docx_paragraphs(docx_path: Path) -> list[str]:
    with zipfile.ZipFile(docx_path) as zf:
        xml_bytes = zf.read("word/document.xml")
    root = ET.fromstring(xml_bytes)

    paragraphs: list[str] = []
    for p in root.iter(f"{W_NS}p"):
        runs = [node.text or "" for node in p.iter(f"{W_NS}t")]
        text = normalize_space("".join(runs))
        if text:
            paragraphs.append(text)
    return paragraphs


def detect_course_title(paragraphs: Iterable[str], fallback_slug: str) -> str:
    explicit_pattern = re.compile(r"^course\s*name\s*:\s*(.+)$", re.IGNORECASE)
    for line in paragraphs:
        match = explicit_pattern.match(line.strip())
        if match:
            explicit = normalize_space(match.group(1))
            if explicit:
                return explicit
    for line in paragraphs:
        if "betterlsat" in line.lower() and len(line) >= 12:
            return line
    return fallback_slug.replace("-", " ").title()


def infer_lesson_type(title: str, body_lines: list[str]) -> str:
    haystack = f"{title}\n" + "\n".join(body_lines[:24])
    lowered = haystack.lower()
    if "adaptive drill" in lowered:
        return "adaptive_drill"
    if "active drill" in lowered or "you try" in lowered:
        return "active_drill"
    if "rep work" in lowered or "review work" in lowered:
        return "rep_work"
    return "video_text"


def extract_duration_minutes(title: str, body_lines: list[str]) -> int | None:
    for text in [title, *body_lines[:16]]:
        match = DURATION_PATTERN.search(text)
        if match:
            value = int(match.group(1))
            return value if 0 <= value <= 300 else None
    return None


def create_summary(body_lines: list[str]) -> str:
    for line in body_lines:
        if len(line) >= 20:
            return line[:280]
    return "Imported from BetterLSAT syllabus DOCX."


def html_paragraphs(lines: list[str]) -> str:
    cooked = [line for line in lines if line]
    if not cooked:
        return "<p>Imported lesson content.</p>"
    return "".join(f"<p>{html.escape(line)}</p>" for line in cooked)


def parse_lessons(paragraphs: list[str]) -> list[LessonDraft]:
    lessons: list[LessonDraft] = []
    current: LessonDraft | None = None
    current_module_label: str | None = None

    for line in paragraphs:
        module_match = MODULE_PATTERN.match(line)
        if module_match:
            module_idx = module_match.group(1)
            module_title = module_match.group(2).strip()
            current_module_label = f"Module {module_idx}" + (f": {module_title}" if module_title else "")

        lesson_match = None
        for pattern in LESSON_PATTERNS:
            lesson_match = pattern.match(line)
            if lesson_match:
                break

        if lesson_match:
            if current:
                lessons.append(current)
            lesson_num = int(lesson_match.group(1))
            title = normalize_space(lesson_match.group(2))
            current = LessonDraft(
                source_heading=line,
                title=title,
                module_label=current_module_label,
                lesson_number_hint=lesson_num,
            )
            continue

        if current:
            current.body_lines.append(line)

    if current:
        lessons.append(current)
    return lessons


def flatten_rows(
    lessons: list[LessonDraft],
    course_slug: str,
    course_title: str,
    course_description: str,
    course_is_published: bool,
    lesson_is_published: bool,
) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen_lesson_slugs: set[str] = set()

    for sort_order, lesson in enumerate(lessons, start=1):
        base_slug = slugify(lesson.title)
        lesson_slug = unique_slug(base_slug, seen_lesson_slugs)
        lesson_type = infer_lesson_type(lesson.title, lesson.body_lines)
        duration = extract_duration_minutes(lesson.title, lesson.body_lines)
        text_content = html_paragraphs(lesson.body_lines)
        summary = create_summary(lesson.body_lines)
        video_url = ""

        rows.append(
            {
                "course_slug": course_slug,
                "course_title": course_title,
                "course_description": course_description,
                "course_is_published": "true" if course_is_published else "false",
                "lesson_slug": lesson_slug,
                "lesson_title": lesson.title,
                "lesson_type": lesson_type,
                "sort_order": str(sort_order),
                "summary": summary,
                "duration_minutes": "" if duration is None else str(duration),
                "video_url": video_url,
                "text_content": text_content,
                "lesson_is_published": "true" if lesson_is_published else "false",
                "source_heading": lesson.source_heading,
                "module_label": lesson.module_label or "",
            }
        )
    return rows


def write_csv(rows: list[dict[str, str]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
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
        "source_heading",
        "module_label",
    ]
    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_json(rows: list[dict[str, str]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--docx", required=True, type=Path, help="Input DOCX path")
    parser.add_argument("--out", required=True, type=Path, help="Output CSV path")
    parser.add_argument("--course-slug", default="betterlsat-core-syllabus")
    parser.add_argument("--course-title", default="")
    parser.add_argument("--course-description", default="Imported from BetterLSAT syllabus DOCX.")
    parser.add_argument("--course-is-published", action="store_true")
    parser.add_argument("--lesson-is-published", action="store_true")
    parser.add_argument("--json-out", type=Path, default=None, help="Optional JSON output path for normalized rows")
    args = parser.parse_args()

    paragraphs = read_docx_paragraphs(args.docx)
    lesson_drafts = parse_lessons(paragraphs)
    if not lesson_drafts:
        raise SystemExit("No lesson boundaries detected. Adjust lesson regex patterns.")

    course_title = args.course_title or detect_course_title(paragraphs, args.course_slug)
    rows = flatten_rows(
        lesson_drafts,
        course_slug=args.course_slug,
        course_title=course_title,
        course_description=args.course_description,
        course_is_published=args.course_is_published,
        lesson_is_published=args.lesson_is_published,
    )
    write_csv(rows, args.out)
    if args.json_out is not None:
        write_json(rows, args.json_out)

    type_counts = Counter(row["lesson_type"] for row in rows)
    print(f"Parsed paragraphs: {len(paragraphs)}")
    print(f"Detected lessons: {len(rows)}")
    print(f"Wrote CSV: {args.out}")
    if args.json_out is not None:
        print(f"Wrote JSON: {args.json_out}")
    print(f"Course slug/title: {args.course_slug} / {course_title}")
    print("Lesson type counts:", dict(type_counts))


if __name__ == "__main__":
    main()
