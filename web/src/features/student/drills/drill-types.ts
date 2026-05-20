export type DrillSectionType = "LR" | "RC"

export type DrillTiming = "unlimited" | "35" | "per-q"
export type DrillShowAnswers = "end" | "each" | "never"
export type DrillSelection = "auto" | "manual"
export type DrillDifficulty = "adaptive" | "easy" | "hard"
export type DrillStatus = "fresh" | "all"

export type DrillChoice = {
  id: string
  index: number
  text: string
}

export type DrillPassage = {
  id: string
  displayNumber: number
  title: string
  body: string
}

export type DrillQuestion = {
  id: string
  questionNumber: number | null
  stimulusText: string | null
  stemText: string | null
  choices: DrillChoice[]
  passage: DrillPassage | null
}

export type DrillSessionMetadata = {
  sectionType: DrillSectionType
  questionCount: number
  timing: string
  showAnswers: string
  selection?: string
  questionTypeId?: string | null
  tagLabel?: string | null
  difficulty?: string | null
  status?: string
  questionIds: string[]
  title?: string | null
}

export type DrillAnswerState = {
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
}

export type DrillSessionResponse = {
  session: {
    id: string
    user_id: string
    kind: string
    prep_test_id: string | null
    section_id: string | null
    started_at: string
    completed_at: string | null
    raw_score: number | null
    scaled_score: number | null
    percentile: number | null
    bookmarked: boolean
    excluded: boolean
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
  }
  metadata: DrillSessionMetadata
  questions: DrillQuestion[]
  answers: DrillAnswerState[]
  drillLabel: string | null
}

export type StartDrillInput = {
  sectionType: DrillSectionType
  questionCount: number
  timing?: DrillTiming
  showAnswers?: DrillShowAnswers
  selection?: DrillSelection
  questionTypeId?: string | null
  tagLabel?: string | null
  difficulty?: DrillDifficulty
  status?: DrillStatus
  title?: string | null
}

export type DrillPoolStatsInput = {
  sectionType: DrillSectionType
  questionTypeId?: string | null
  difficulty?: DrillDifficulty
  status?: DrillStatus
}

export type DrillPoolStats = {
  selectedCount: number
  totalCount: number
}

export const drillConfigOptions = {
  questionCount: [
    { label: "1", value: "1" },
    { label: "5", value: "5" },
    { label: "10", value: "10" },
    { label: "25", value: "25" },
  ],
  timing: [
    { label: "Unlimited", value: "unlimited" },
    { label: "35 minutes", value: "35" },
    { label: "Per question (1:20)", value: "per-q" },
  ],
  showAnswers: [
    { label: "At the end", value: "end" },
    { label: "After each question", value: "each" },
    { label: "Never (blind)", value: "never" },
  ],
  selection: [
    { label: "Pick automatically", value: "auto" },
    { label: "Choose manually", value: "manual" },
  ],
  tags: [{ label: "Any", value: "any" }],
  difficulty: [
    { label: "Adaptive", value: "adaptive" },
    { label: "Easy", value: "easy" },
    { label: "Hard", value: "hard" },
  ],
  status: [
    { label: "Fresh", value: "fresh" },
    { label: "Include reviewed", value: "all" },
  ],
} as const
