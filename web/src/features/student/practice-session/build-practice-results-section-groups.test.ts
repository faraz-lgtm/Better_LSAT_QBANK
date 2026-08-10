import { describe, expect, it } from "vitest"

import type { DrillQuestion } from "@/features/student/drills/drill-types"
import { buildPracticeResultsSectionGroups } from "@/features/student/practice-session/build-practice-results-section-groups"

function question(id: string): DrillQuestion {
  return {
    id,
    questionNumber: 1,
    stimulusText: null,
    stemText: null,
    choices: [],
    passage: null,
  }
}

describe("buildPracticeResultsSectionGroups blind review fallback", () => {
  it("inherits Actual when Blind Review is skipped", () => {
    const answersByQuestion = new Map([
      ["q-1", { selectedAnswer: "A", isCorrect: false }],
      ["q-2", { selectedAnswer: "B", isCorrect: true }],
    ])
    const blindReviewAnswersByQuestion = new Map([
      ["q-1", { selectedAnswer: "C", isCorrect: false }],
      // q-2 skipped
    ])

    const groups = buildPracticeResultsSectionGroups({
      questions: [question("q-1"), question("q-2")],
      answersByQuestion,
      blindReviewAnswersByQuestion,
      detailsByQuestion: {},
      defaultKind: "LR",
      fallbackSectionNumber: 2,
      perQuestionSeconds: 60,
    })

    const questions = groups[0]?.questions ?? []
    expect(questions[0]?.blindReviewUnanswered).toBe(false)
    expect(questions[0]?.blindReviewCorrect).toBe(false)
    expect(questions[1]?.blindReviewUnanswered).toBe(false)
    expect(questions[1]?.blindReviewCorrect).toBe(true)
    expect(groups[0]?.blindReviewDisplay).toBe("-1")
  })

  it("keeps Blind Review answer when Actual was skipped", () => {
    const answersByQuestion = new Map<string, { selectedAnswer: string; isCorrect: boolean }>()
    const blindReviewAnswersByQuestion = new Map([
      ["q-1", { selectedAnswer: "B", isCorrect: true }],
    ])

    const groups = buildPracticeResultsSectionGroups({
      questions: [question("q-1")],
      answersByQuestion,
      blindReviewAnswersByQuestion,
      detailsByQuestion: {},
      defaultKind: "LR",
      fallbackSectionNumber: 1,
      perQuestionSeconds: 60,
    })

    const q = groups[0]?.questions[0]
    expect(q?.isUnanswered).toBe(true)
    expect(q?.blindReviewUnanswered).toBe(false)
    expect(q?.blindReviewCorrect).toBe(true)
    expect(groups[0]?.blindReviewDisplay).toBe("0")
  })

  it("keeps both unanswered when Actual and Blind Review are skipped", () => {
    const groups = buildPracticeResultsSectionGroups({
      questions: [question("q-1")],
      answersByQuestion: new Map(),
      blindReviewAnswersByQuestion: new Map(),
      detailsByQuestion: {},
      defaultKind: "LR",
      fallbackSectionNumber: 1,
      perQuestionSeconds: 60,
    })

    const q = groups[0]?.questions[0]
    expect(q?.isUnanswered).toBe(true)
    expect(q?.blindReviewUnanswered).toBe(true)
    expect(q?.blindReviewCorrect).toBe(false)
  })
})
