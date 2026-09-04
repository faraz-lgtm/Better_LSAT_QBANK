/** View models for the explanation question detail screen — swap `buildExplanationQuestionDetailView` for API mapping later. */

export type ExplanationDetailTabId = "question" | "explanation" | "analytics"

export type ExplanationChoice = {
  id: string
  /** Display index 1–5 in designs; maps to A–E via index. */
  index: number
  text: string
  explanationHtml?: string | null
}

export type ExplanationVideoBlock = {
  id: string
  headerVariant: "muted" | "yellow"
  authorTitle: string
  dropdownLabel: string
  dropdownOptions: { value: string; label: string }[]
  postedLine: string
  videoUrl?: string | null
  explanationHtml?: string | null
}

export type ExplanationAnswerPopularityRow = {
  letter: string
  count: number
  pct: number
  /** Correct answer (or most chosen when correct unknown). */
  highlight?: boolean
  /** Average LSAT score for students who chose this answer (when available). */
  avgScore?: number | null
}

export type ExplanationHistoryRow = {
  source: string
  dateLabel: string
  status: "in_process" | "answered"
  timeRange: string
}

export type ExplanationQuestionDetailView = {
  routeKey: string
  /** e.g. PT 160 S1 P1 Q1 */
  headingCode: string
  /** e.g. PrepTest 160 - Section 1 - Passage 1 - Question 1 */
  subtitleTrail: string
  questionNumber: number
  passage: {
    displayNumber: number
    title: string
    body: string
  }
  /** RC paragraph analysis shown via "Show analysis" (P1, P2, …). */
  passageAnalysis?: {
    paragraphs: Array<{
      label: string
      /** Original passage `<p>` HTML for this paragraph, when available. */
      passageHtml?: string | null
      explanationHtml: string
    }>
    overallHtml: string | null
  } | null
  correctChoiceLetter: string
  questionStem: string
  /** Question-level written explanation (expandable under the stem). */
  questionExplanationHtml?: string | null
  choices: ExplanationChoice[]
  correctChoiceId: string
  videos: ExplanationVideoBlock[]
    analytics: {
      questionDifficulty: {
        filled: number
        max: number
        label: string
        caption: string
        /** Meter + pill accent (Figma analytics difficulty). */
        tone: "green" | "teal" | "red"
      }
      /** Present for RC only — LR/LG have no multi-question passage difficulty. */
      passageDifficulty?: {
        filled: number
        max: number
        label: string
        caption: string
        tone: "green" | "teal" | "red"
      }
    scoreBand: { headline: string; range: string; caption: string }
    answerPopularity: ExplanationAnswerPopularityRow[]
    answerPopularityTotal: number
    /** Current user's latest submitted answer letter (A–E), or null if never answered. */
    userSelectedLetter: string | null
    /** Difficulty-based target seconds (accommodations applied in the UI). */
    targetTimeSeconds: number
    /** Latest attempt dwell time when available; null until per-question timing is tracked. */
    yourTimeSeconds: number | null
    questionStemTags: string[]
    passageTags: string[]
    history: ExplanationHistoryRow[]
  }
  neighbors: { prevRouteKey: string | null; nextRouteKey: string | null }
  hasExplanationTab: boolean
}
