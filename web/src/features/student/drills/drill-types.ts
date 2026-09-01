import { LR_DRILL_MAX_QUESTION_COUNT } from "@/features/student/drills/adaptive-drill-config"

export type DrillSectionType = "LR" | "RC"

export type DrillQuestionCount = number | "unlimited"

export function isUnlimitedDrillQuestionCount(value: unknown): value is "unlimited" {
  return value === "unlimited"
}

export type DrillTiming = "unlimited" | "35" | "per-q"
export type DrillShowAnswers = "end" | "each" | "never"
export type DrillSelection = "auto" | "manual"
export type DrillDifficulty = "adaptive" | "easy" | "hard"
export type DrillStatus = "fresh" | "all"

export type DrillChoice = {
  id: string
  index: number
  text: string
  explanationHtml?: string | null
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
  /** LSAC/RC passage group — preferred for nav passage dividers. */
  sourceGroupId?: string | null
  correctChoiceId?: string | null
}

export type DrillSessionMetadata = {
  sectionType: DrillSectionType
  questionCount: DrillQuestionCount
  passageCount?: number | "unlimited"
  timing: string
  showAnswers: string
  selection?: string
  questionTypeId?: string | null
  tagLabel?: string | null
  difficulty?: string | null
  status?: string
  questionIds: string[]
  title?: string | null
  flaggedQuestionIds?: string[]
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
  questionCount: DrillQuestionCount
  passageCount?: number | "unlimited"
  timing?: DrillTiming
  showAnswers?: DrillShowAnswers
  selection?: DrillSelection
  questionTypeId?: string | null
  tagLabel?: string | null
  difficulty?: DrillDifficulty
  status?: DrillStatus
  title?: string | null
  source?: "dashboard_adaptive_drill"
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

function buildDrillQuestionCountOptions() {
  const numeric = Array.from({ length: LR_DRILL_MAX_QUESTION_COUNT }, (_, index) => {
    const value = String(index + 1)
    return { label: value, value }
  })
  return [{ label: "Unlimited", value: "unlimited" }, ...numeric]
}

export const drillConfigOptions = {
  questionCount: buildDrillQuestionCountOptions(),
  passageCount: [
    { label: "Unlimited", value: "unlimited" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "7", value: "7" },
    { label: "8", value: "8" },
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
