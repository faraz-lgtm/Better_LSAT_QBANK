export type PrepLessonStatus = "video_text" | "active_drill" | "adaptive_drill" | "rep_work"

export function normalizeLessonStatus(value: string | null | undefined): PrepLessonStatus {
  if (value === "active_drill" || value === "adaptive_drill" || value === "rep_work") return value
  return "video_text"
}
