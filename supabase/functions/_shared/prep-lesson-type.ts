export const PREP_LESSON_TYPES = ["video_text", "active_drill", "adaptive_drill", "rep_work"] as const

export type PrepLessonType = (typeof PREP_LESSON_TYPES)[number]

export function isPrepLessonType(value: string): value is PrepLessonType {
  return (PREP_LESSON_TYPES as readonly string[]).includes(value)
}

export function coercePrepLessonType(value: string | undefined): PrepLessonType {
  return value && isPrepLessonType(value) ? value : "video_text"
}

export type PrepDrillLessonType = "active_drill" | "adaptive_drill" | "rep_work"

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
  return null
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
