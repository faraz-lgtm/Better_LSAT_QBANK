import type { PrepCourseCurriculum, PrepCourseLessonRow } from "@/lib/api/admin"

export function parseDurationInputToMinutes(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const hMatch = t.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/i)
  const mMatch = t.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?)?/i)
  if (hMatch || mMatch) {
    const h = hMatch ? Number(hMatch[1]) : 0
    const m = mMatch ? Number(mMatch[1]) : 0
    const total = Math.round(h * 60 + m)
    return Number.isFinite(total) ? total : null
  }
  const n = Number(t.replace(/,/g, ""))
  return Number.isFinite(n) ? Math.round(n) : null
}

export function formatMinutesAsDuration(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes)) return ""
  if (minutes < 60) return String(minutes)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function flattenLessonsFromCurriculum(curriculum: PrepCourseCurriculum): PrepCourseLessonRow[] {
  const lessons: PrepCourseLessonRow[] = []
  for (const mod of curriculum.modules) {
    for (const section of mod.sections) {
      for (const lesson of section.lessons) {
        lessons.push(lesson)
      }
    }
  }
  return lessons
}

export type BuilderSelection =
  | { kind: "module"; id: string }
  | { kind: "section"; id: string }
  | { kind: "lesson"; id: string }

/** Append a block (e.g. `<hr>`, `<p>…</p>`) to lesson HTML body content. */
export function appendLessonHtmlBlock(existingHtml: string, blockHtml: string): string {
  const base = (existingHtml || "").trim() || "<p></p>"
  const block = blockHtml.trim()
  if (!block) return base
  return `${base}${block}`
}

export function focusLessonBodyEditor(anchorId = "lesson-instructions-anchor"): void {
  const anchor = document.getElementById(anchorId)
  anchor?.scrollIntoView({ behavior: "smooth", block: "start" })
  window.requestAnimationFrame(() => {
    const prose = anchor?.querySelector<HTMLElement>(".ProseMirror")
    prose?.focus()
  })
}
