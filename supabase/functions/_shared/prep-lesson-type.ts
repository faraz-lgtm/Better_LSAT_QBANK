export const PREP_LESSON_TYPES = ["video_text", "active_drill", "adaptive_drill", "rep_work"] as const

export type PrepLessonType = (typeof PREP_LESSON_TYPES)[number]

export function isPrepLessonType(value: string): value is PrepLessonType {
  return (PREP_LESSON_TYPES as readonly string[]).includes(value)
}

export function coercePrepLessonType(value: string | undefined): PrepLessonType {
  return value && isPrepLessonType(value) ? value : "video_text"
}
