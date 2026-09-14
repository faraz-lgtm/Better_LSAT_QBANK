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

/**
 * TipTap serializes blank lines as `<p></p>`. Empty paragraphs have no box height,
 * so CSS margin-collapse makes several Enters look like a single gap. Persist a `<br>`
 * so each blank line keeps vertical space in the editor and student lesson view.
 */
export function preserveEmptyParagraphBreaks(html: string): string {
  return html.replace(/<p(\b[^>]*)?>\s*<\/p>/gi, "<p$1><br></p>")
}

/**
 * TipTap's getHTML() and our persisted HTML often differ only by empty-paragraph
 * form or the editor-only trailing-break class. Treat those as the same document
 * so the controlled editor does not call setContent on every keystroke.
 */
export function normalizeTipTapHtml(html: string): string {
  const source = (html || "").trim() ? html : "<p></p>"
  return preserveEmptyParagraphBreaks(source).replace(/\s*class="ProseMirror-trailingBreak"/gi, "")
}

export function shouldApplyIncomingEditorHtml(
  incoming: string,
  lastEmitted: string,
  currentEditorHtml: string,
): boolean {
  const next = normalizeTipTapHtml(incoming)
  if (next === normalizeTipTapHtml(lastEmitted)) return false
  if (next === normalizeTipTapHtml(currentEditorHtml)) return false
  return true
}

/** Re-hydrate the lesson form only when the selected lesson id changes — not when the row object is replaced after a curriculum reload. */
export function shouldHydrateLessonForm(hydratedLessonId: string, nextLessonId: string | null | undefined): boolean {
  if (!nextLessonId) return false
  return hydratedLessonId !== nextLessonId
}

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
