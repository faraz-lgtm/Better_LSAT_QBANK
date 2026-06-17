import type { DrillAnswerState, DrillQuestion } from "@/features/student/drills/drill-types"

export type SectionType = "LR" | "RC"

export type SectionTiming = "unlimited" | "35" | "standard"
export type SectionShowAnswers = "end" | "each" | "never"

export type SectionPoolItem = {
  id: string
  sectionId: string | null
  sectionNumber: number | null
  sectionType: SectionType
  title: string | null
  moduleId: string | null
  prepTestId: string
  prepTestTitle: string | null
  questionCount: number
  timeMinutes: number
}

export type SectionSessionMetadata = {
  sectionType: SectionType
  timing: string
  showAnswers: string
  questionIds: string[]
  prepTestTitle?: string | null
  sectionTitle?: string | null
  answeredQuestionIds?: string[]
  flaggedQuestionIds?: string[]
  seenQuestionIds?: string[]
}

export type SectionSessionResponse = {
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
  metadata: SectionSessionMetadata
  section: SectionPoolItem
  questions: DrillQuestion[]
  answers: DrillAnswerState[]
  blindReviewAnswers?: DrillAnswerState[]
  blindReviewRawScore?: number | null
  sessionLabel: string | null
}

export type SectionPoolSort = "newest" | "oldest"

export type SectionPoolTypeCounts = {
  all: number
  lr: number
  rc: number
}

export type SectionPoolListResult = {
  sections: SectionPoolItem[]
  total: number
  page: number
  pageSize: number
  sectionTypeCounts: SectionPoolTypeCounts
}

export type ListSectionPoolInput = {
  sectionType?: SectionType
  page?: number
  pageSize?: number
  sort?: SectionPoolSort
}

export type StartSectionInput = {
  sectionId: string
  timing?: SectionTiming
  showAnswers?: SectionShowAnswers
}

export function formatSectionPoolLabel(item: SectionPoolItem): string {
  const pt = item.prepTestTitle ?? item.moduleId ?? "PrepTest"
  const section = item.title ?? (item.sectionId ? `Section ${item.sectionId}` : "Section")
  return `${pt} — ${section}`
}

export const sectionConfigOptions = {
  timing: [
    { label: "Unlimited", value: "unlimited" },
    { label: "35 minutes", value: "35" },
    { label: "Standard", value: "standard" },
  ],
  showAnswers: [
    { label: "At the end", value: "end" },
    { label: "After each question", value: "each" },
    { label: "Never (blind)", value: "never" },
  ],
  sort: [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
  ],
} as const
