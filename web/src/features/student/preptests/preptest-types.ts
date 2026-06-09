export type PrepTestPracticeStatus = "fresh" | "in_progress" | "completed"

export type PrepTestPoolFilter = "all" | "fresh" | "in_progress" | "completed"

export type PrepTestPoolSort = "newest" | "oldest"

export type PrepTestPoolStatusCounts = {
  all: number
  fresh: number
  in_progress: number
  completed: number
}

export type PrepTestPoolListResult = {
  prepTests: PrepTestPoolItem[]
  total: number
  page: number
  pageSize: number
  statusCounts: PrepTestPoolStatusCounts
}

export type PrepTestPoolBlindReviewStatus = "eligible" | "in_progress"

export type PrepTestPoolAttempt = {
  sessionId: string
  completedAt: string
  scaledScore: number | null
  blindReviewScaledScore: number | null
  attemptNumber: number
}

export type PrepTestPoolItem = {
  id: string
  moduleId: string
  title: string | null
  prepTestNumber: string | null
  questionCount: number
  sectionCount: number
  practiceableSectionCount: number
  timeMinutes: number
  status: PrepTestPracticeStatus
  scaledScore: number | null
  blindReviewScaledScore: number | null
  blindReviewStatus: PrepTestPoolBlindReviewStatus | null
  completedAt: string | null
  attempts: PrepTestPoolAttempt[]
  openPrepTestSessionId: string | null
}

export type PrepTestDetailSection = {
  id: string
  sectionId: string | null
  sectionNumber: number | null
  sectionType: "LR" | "RC" | "LG"
  title: string | null
  questionCount: number
  timeMinutes: number
  practiceable: boolean
  unlocked: boolean
  onBreak: boolean
  answeredCount: number
  completed: boolean
  activeSectionSessionId: string | null
}

export type PrepTestSectionBreak = {
  afterSectionId: string
  endsAt: string
  remainingSeconds: number
}

export type PrepTestDetailResponse = {
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
  sections: PrepTestDetailSection[]
  sectionBreak: PrepTestSectionBreak | null
  prepTestSession: {
    id: string
    metadata: Record<string, unknown>
  } | null
  status: PrepTestPracticeStatus
  allPracticeableSectionsComplete: boolean
  timingOptions: { id: string; label: string }[]
  formatOptions: { id: string; label: string }[]
  defaultTimingId: string
  defaultFormatId: string
}

export type StartPrepTestInput = {
  prepTestId: string
  timing?: string
  format?: string
}

export type StartPrepTestResponse = {
  prepTestSession: { id: string; kind: string; metadata: Record<string, unknown> }
  detail: PrepTestDetailResponse
}
