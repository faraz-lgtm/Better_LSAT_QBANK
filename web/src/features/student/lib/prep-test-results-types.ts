export type QuestionResultStatus = "correct" | "incorrect"

export type PrepTestSectionKind = "LR" | "RC"

export type PrepTestSectionSummary = {
  id: string
  kind: PrepTestSectionKind
  longName: string
  sectionLabel: string
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
  scoreDisplay: string
  blindReviewDisplay: string
  questions: PrepTestQuestionResultRow[]
}

export type PrepTestLrSectionBlock = {
  sectionTitle: string
  scoreDisplay: string
  blindReviewDisplay: string
  passages: PrepTestPassageSummary[]
  questions: PrepTestQuestionResultRow[]
}

export type PrepTestResultsDetail = {
  totalQuestions: number
  scaledScore: number
  correct: number
  incorrect: number
  correctSummary: string
  percentile: number
  prediction: number
  blindReview: number
  sections: PrepTestSectionSummary[]
  lrSections: PrepTestLrSectionBlock[]
  passages: PrepTestPassageSummary[]
  questions: PrepTestQuestionResultRow[]
  about: PrepTestAboutMeta
  rcSection: PrepTestRcSectionBlock
}
