export type BlindReviewStatus = "eligible" | "in_progress" | "completed"

export type BlindReviewPoolItem = {
  id: string
  moduleId: string
  title: string | null
  prepTestNumber: string | null
  label: string
  questionCount: number
  status: BlindReviewStatus
  scaledScore: number | null
  blindReviewScaledScore: number | null
  completedAt: string | null
  blindReviewCompletedAt: string | null
}

export type BlindReviewDetailSection = {
  id: string
  sectionId: string | null
  sectionNumber: number | null
  sectionType: "LR" | "RC" | "LG"
  title: string | null
  questionCount: number
  timeMinutes: number
  practiceable: boolean
  unlocked: boolean
  answeredCount: number
  completed: boolean
  activeSectionSessionId: string | null
  sectionSessionId: string | null
}

export type BlindReviewDetailResponse = {
  prepTest: {
    id: string
    moduleId: string
    title: string | null
    prepTestNumber: string | null
    label: string
    questionCount: number
    totalMinutes: number
    sectionCount: number
    practiceableSectionCount: number
  }
  sections: BlindReviewDetailSection[]
  blindReview: {
    status: BlindReviewStatus
    scaledScore: number | null
    blindReviewScaledScore: number | null
    blindReviewPercentile: number | null
    prepTestSessionId: string
  }
}
