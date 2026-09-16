import { resolveDrillLessonType } from "@/features/prep-course/lib/prep-course-format"
import type { PrepLesson, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

export function activeDrillStartPath(courseSlug: string, lessonSlug: string): string {
  return `/app/prep-course/${courseSlug}/${lessonSlug}/start`
}

export function resolveLessonDrillStartAction(
  lesson: PrepLesson,
  isStartScreen: boolean,
): "open-start-screen" | "start-session" {
  if (resolveDrillLessonType(lesson) === "active_drill" && !isStartScreen) {
    return "open-start-screen"
  }
  return "start-session"
}

export function activeDrillStartMetaLine(lesson: PrepLesson): string {
  const minutes = lesson.duration_minutes ?? 0
  const read = minutes > 0 ? `${minutes} min read` : null
  const video = lesson.video_url?.trim() ? "video" : "no video"
  return [read, video].filter(Boolean).join(" · ")
}

/** Active drills always start the linked PrepTest question, not a generic drill set. */
export function startLessonDrillRequest(
  lesson: PrepLesson,
  linkedQuestionRefs: PrepLessonLinkedQuestionRef[],
): { lessonId: string; questionId?: string } {
  const questionId = linkedQuestionRefs[0]?.question_id?.trim() || undefined
  if (resolveDrillLessonType(lesson) === "active_drill" && questionId) {
    return { lessonId: lesson.id, questionId }
  }
  return { lessonId: lesson.id }
}
