export const PREP_LESSON_TYPES = ["video_text", "active_drill", "adaptive_drill", "rep_work"] as const

export type PrepLessonType = (typeof PREP_LESSON_TYPES)[number]

export function isPrepLessonType(value: string): value is PrepLessonType {
  return (PREP_LESSON_TYPES as readonly string[]).includes(value)
}

export function coercePrepLessonType(value: string | undefined): PrepLessonType {
  return value && isPrepLessonType(value) ? value : "video_text"
}

export type PrepDrillLessonType = "active_drill" | "adaptive_drill" | "rep_work"

const LESSON_TITLE_DRILL_PREFIXES: Array<{ pattern: RegExp; kind: PrepDrillLessonType }> = [
  { pattern: /^Rep Work\b/i, kind: "rep_work" },
  { pattern: /^Active Drill\b/i, kind: "active_drill" },
  { pattern: /^Adaptive Drill\b/i, kind: "adaptive_drill" },
  { pattern: /^Full Drill\b/i, kind: "adaptive_drill" },
]

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function parseDrillKindFromTitle(title: string): PrepDrillLessonType | null {
  for (const entry of LESSON_TITLE_DRILL_PREFIXES) {
    if (entry.pattern.test(title.trim())) return entry.kind
  }
  return null
}

export function parseDrillKindFromSlug(slug: string): PrepDrillLessonType | null {
  const normalized = slug.trim().toLowerCase()
  if (normalized.startsWith("full-drill") || normalized.startsWith("adaptive-drill")) {
    return "adaptive_drill"
  }
  if (normalized.startsWith("active-drill")) return "active_drill"
  if (normalized.startsWith("rep-work")) return "rep_work"
  return null
}

function inferDrillKindFromContent(lesson: {
  title: string
  summary?: string | null
  text_content?: string | null
}): PrepDrillLessonType | null {
  const haystack = [
    lesson.title,
    lesson.summary ?? "",
    stripHtml(lesson.text_content ?? ""),
  ]
    .join("\n")
    .toLowerCase()

  if (/\bfull drill\b/.test(haystack) || /\badaptive drill\b/.test(haystack)) {
    return "adaptive_drill"
  }
  if (/\bactive drill\b/.test(haystack) || /\byou try\b/.test(haystack)) {
    return "active_drill"
  }
  if (/\brep work\b/.test(haystack) || /\breview work\b/.test(haystack)) {
    return "rep_work"
  }
  return null
}

export function resolvePrepDrillLessonType(lesson: {
  lesson_type: string
  title: string
  slug?: string
  summary?: string | null
  text_content?: string | null
}): PrepDrillLessonType | null {
  if (
    lesson.lesson_type === "active_drill" ||
    lesson.lesson_type === "adaptive_drill" ||
    lesson.lesson_type === "rep_work"
  ) {
    return lesson.lesson_type
  }

  const fromTitle = parseDrillKindFromTitle(lesson.title)
  if (fromTitle) return fromTitle

  if (lesson.slug) {
    const fromSlug = parseDrillKindFromSlug(lesson.slug)
    if (fromSlug) return fromSlug
  }

  return inferDrillKindFromContent(lesson)
}

export function isPrepCourseDrillLesson(lesson: {
  lesson_type: string
  title: string
  slug?: string
  summary?: string | null
  text_content?: string | null
}): boolean {
  const kind = resolvePrepDrillLessonType(lesson)
  return kind === "active_drill" || kind === "adaptive_drill"
}
