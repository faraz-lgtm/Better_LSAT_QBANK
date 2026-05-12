export const ADMIN_QUESTION_VIDEO_SAVED = "admin-question-video-saved" as const

export const ADMIN_LESSON_VIDEO_SAVED = "admin-lesson-video-saved" as const

export type AdminQuestionVideoSavedPayload = {
  type: typeof ADMIN_QUESTION_VIDEO_SAVED
  questionId: string
  videoUrl: string
}

export type AdminLessonVideoSavedPayload = {
  type: typeof ADMIN_LESSON_VIDEO_SAVED
  lessonId: string
  videoUrl: string
}
