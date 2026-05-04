export const ADMIN_QUESTION_VIDEO_SAVED = "admin-question-video-saved" as const

export type AdminQuestionVideoSavedPayload = {
  type: typeof ADMIN_QUESTION_VIDEO_SAVED
  questionId: string
  videoUrl: string
}
