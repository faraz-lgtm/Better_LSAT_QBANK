export type ExplanationQuestionStatus = "in_process" | "not_started" | "answered" | "fresh" | "seen"

export type ExplanationQuestionNode = {
  id: string
  number: number
  code: string
  snippet: string
  topicName: string
  status: ExplanationQuestionStatus
  source: string
  difficulty: 1 | 2 | 3 | 4 | 5
  hasVideo?: boolean
  hasWrittenExplanation?: boolean
  bookmarked?: boolean
}

export type ExplanationPassageNode = {
  id: string
  label: string
  title: string
  snippet: string
  questions: ExplanationQuestionNode[]
}

export type ExplanationSectionNode = {
  id: string
  sectionNumber: number
  kind: "LR" | "RC" | "LG"
  sectionTitle: string
  flags?: string
  passages: ExplanationPassageNode[]
}

export type ExplanationPrepTestNode = {
  id: string
  prepTestNumber: string
  rowSubtitle: string
  sections: ExplanationSectionNode[]
}

export type ExplanationPrepTestListItem = {
  id: string
  title: string
  moduleId: string
  prepTestNumber: string | null
  questionCount: number
  explainedCount: number
  /** Figma list subtitle — e.g. "Fresh", "In Process • Blind Review" */
  rowSubtitle?: string
}

export type ExplanationStatusCounts = {
  in_process: number
  fresh: number
  answered: number
  seen: number
}

export type ExplanationDetailPayload = {
  questionId: string
  prepTestId: string
  prepTestTitle: string
  prepTestNumber: string | null
  sectionId: string
  sectionType: "LR" | "RC" | "LG" | null
  sectionNumber: number | null
  questionNumber: number | null
  topicName: string
  tags?: string[]
  explanationHtml: string | null
  videoUrl: string | null
  stimulusText: string | null
  stemText: string | null
  choices: { id: string; index: number; text: string; explanationHtml: string | null }[]
  correctChoiceId: string | null
  passage: {
    id: string
    displayNumber: number
    title: string
    body: string
  }
  /** RC passage paragraph analysis (P1, P2, …) when published. */
  passageAnalysis?: {
    paragraphs: Array<{
      label: string
      passageHtml?: string | null
      explanationHtml: string
    }>
    overallHtml: string | null
  } | null
  answerPopularity: ExplanationAnswerPopularityRow[]
  /** Unique users whose latest answer was counted. Percents omitted when below the sample floor. */
  answerPopularityTotal?: number
  /** Current user's latest submitted answer letter (A–E), or null if never answered. */
  userSelectedLetter?: string | null
  difficulty?: 1 | 2 | 3 | 4 | 5
}

export type ExplanationAnswerPopularityRow = {
  letter: string
  count: number
  pct: number
  highlight?: boolean
  avgScore?: number | null
}
