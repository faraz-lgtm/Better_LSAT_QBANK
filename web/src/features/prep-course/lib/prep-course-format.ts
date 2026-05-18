import type { PrepLesson } from "@/lib/api/prep-course"

export function totalDurationMinutes(lessons: PrepLesson[]): number {
  return lessons.reduce((sum, lesson) => sum + (lesson.duration_minutes ?? 0), 0)
}

export function formatDurationLabel(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min"
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (mins === 0) return hours === 1 ? "1 hour" : `${hours} hours`
  return `${hours} hr ${mins} min`
}

export function formatDurationShort(minutes: number | null | undefined): string {
  const m = minutes ?? 0
  return m === 1 ? "1 min" : `${m} mins`
}

export function formatCourseHoursLabel(totalMinutes: number): string {
  if (totalMinutes < 60) return `About ${totalMinutes} min of content`
  const hours = Math.ceil(totalMinutes / 60)
  return `About ${hours}+ hours of content`
}

export function lessonMetaLine(lesson: PrepLesson, courseTitle: string): string {
  const topic = lesson.summary?.trim() || courseTitle
  const duration = formatDurationShort(lesson.duration_minutes)
  return `${topic} • ${duration}`
}

export function nextLessonSlug(lessons: PrepLesson[], currentSlug: string): string | null {
  const idx = lessons.findIndex((l) => l.slug === currentSlug)
  if (idx < 0) return lessons[0]?.slug ?? null
  return lessons[idx + 1]?.slug ?? null
}
