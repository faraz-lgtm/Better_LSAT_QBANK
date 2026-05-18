/** View models for the explanation question detail screen — swap `buildExplanationQuestionDetailView` for API mapping later. */

export type ExplanationDetailTabId = "question" | "explanation" | "analytics"

export type ExplanationChoice = {
  id: string
  /** Display index 1–5 in designs; maps to A–E via index. */
  index: number
  text: string
}

export type ExplanationVideoBlock = {
  id: string
  headerVariant: "muted" | "yellow"
  authorTitle: string
  dropdownLabel: string
  dropdownOptions: { value: string; label: string }[]
  postedLine: string
}

export type ExplanationAnswerPopularityRow = {
  letter: string
  pct: number
  avgScore: string
  /** Strongest bar (e.g. correct / most chosen). */
  highlight?: boolean
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
  /** e.g. PrepTest 160 > Section 1 > … */
  subtitleTrail: string
  passage: {
    displayNumber: number
    title: string
    body: string
  }
  questionStem: string
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
        tone: "orange" | "red"
      }
      passageDifficulty: {
        filled: number
        max: number
        label: string
        caption: string
        tone: "orange" | "red"
      }
    scoreBand: { headline: string; range: string; caption: string }
    answerPopularity: ExplanationAnswerPopularityRow[]
    questionStemTags: string[]
    passageTags: string[]
    history: ExplanationHistoryRow[]
  }
  neighbors: { prevRouteKey: string | null; nextRouteKey: string | null }
}
