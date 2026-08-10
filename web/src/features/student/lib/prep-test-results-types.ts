export type QuestionResultStatus = "correct" | "incorrect" | "unanswered"

export type PrepTestSectionKind = "LR" | "RC"

export type PrepTestSectionSummary = {
  id: string
  kind: PrepTestSectionKind
  longName: string
  sectionLabel: string
  isExperimental: boolean
  scoreDelta: number
  /** Row-major groups of question outcomes for the icon grid (Figma uses 7 per row). */
  questionRows: QuestionResultStatus[][]
  accuracyPct: number
}

export type PrepTestPassageSummary = {
  id: string
  passageLabel: string
  title: string
  tags: string[]
  difficulty: "Easiest" | "Easy" | "Medium" | "Hard" | "Hardest"
  difficultyDots: number
  targetTime: string
  yourTime: string
  yourTimeNote: string
}

export type PrepTestQuestionResultRow = {
  id: string
  number: number
  title: string
  tags: string[]
  targetTime: string
  yourTime: string
  yourTimeNote: string
  difficulty: "Easiest" | "Easy" | "Medium" | "Hard" | "Hardest"
  difficultyDots: number
  actualCorrect: boolean
  blindReviewCorrect: boolean
  blindReviewUnanswered: boolean
  isUnanswered: boolean
  /** Heights 0–100 for A–E popularity bars */
  answerPopularity: [number, number, number, number, number]
  correctLetter: "A" | "B" | "C" | "D" | "E"
}

export type PrepTestAboutMeta = {
  questionCount: string
  timing: string
  timeUsed: string
  take: string
  format: string
  source: string
}

export type PrepTestRcSectionBlock = {
  sectionTitle: string
  isExperimental: boolean
  scoreDisplay: string
  blindReviewDisplay: string
  questions: PrepTestQuestionResultRow[]
}

export type PrepTestLrSectionBlock = {
  sectionTitle: string
  isExperimental: boolean
  scoreDisplay: string
  blindReviewDisplay: string
  passages: PrepTestPassageSummary[]
  questions: PrepTestQuestionResultRow[]
}

/** Ordered LR/RC detail blocks for the results list (includes experimental). */
export type PrepTestSectionDetailBlock = {
  kind: PrepTestSectionKind
  sectionTitle: string
  isExperimental: boolean
  scoreDisplay: string
  blindReviewDisplay: string
  passages: PrepTestPassageSummary[]
  questions: PrepTestQuestionResultRow[]
}

export type PrepTestResultsDetail = {
  /** Scored (non-experimental) question count — used for hero correct/total. */
  totalQuestions: number
  /** All listed questions including experimental — used for Total Questions bar. */
  listedQuestionCount: number
  scaledScore: number
  correct: number
  incorrect: number
  correctSummary: string
  percentile: number
  prediction: number
  blindReview: number
  blindReviewCompleted: boolean
  sections: PrepTestSectionSummary[]
  lrSections: PrepTestLrSectionBlock[]
  /** All section detail blocks in section-number order (scored + experimental). */
  sectionBlocks: PrepTestSectionDetailBlock[]
  passages: PrepTestPassageSummary[]
  questions: PrepTestQuestionResultRow[]
  about: PrepTestAboutMeta
  rcSection: PrepTestRcSectionBlock
  rcSections: PrepTestRcSectionBlock[]
}
