export type BlindReviewStatus = "eligible" | "in_progress" | "completed"

export type BlindReviewPoolFilter = "all" | BlindReviewStatus

export type BlindReviewPoolSort = "newest" | "oldest"

export type BlindReviewPoolStatusCounts = {
  all: number
  eligible: number
  in_progress: number
  completed: number
}

export type BlindReviewPoolListResult = {
  prepTests: BlindReviewPoolItem[]
  total: number
  page: number
  pageSize: number
  statusCounts: BlindReviewPoolStatusCounts
}

import type { PrepTestPoolAttempt } from "@/features/student/preptests/preptest-types"

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
  prepTestSessionId: string | null
  attempts: PrepTestPoolAttempt[]
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
