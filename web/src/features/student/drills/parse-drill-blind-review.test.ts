import { describe, expect, it } from "vitest"

import {
  applyActualFallbackToBlindReview,
  parseDrillBlindReviewFromMetadata,
  parseSectionBlindReviewFromMetadata,
  resolveSectionBlindReviewForResults,
} from "@/features/student/drills/parse-drill-blind-review"

describe("parseDrillBlindReviewFromMetadata", () => {
  it("returns null when blind review was not completed", () => {
    expect(parseDrillBlindReviewFromMetadata({})).toBeNull()
  })

  it("parses blind review answers and raw score from session metadata", () => {
    const parsed = parseDrillBlindReviewFromMetadata({
      drillBlindReviewCompletedAt: "2026-01-02T00:00:00Z",
      drillBlindReviewRawScore: 1,
      drillBlindReviewAnswers: [
        { questionId: "q-1", selectedAnswer: "B", isCorrect: true },
      ],
    })

    expect(parsed?.rawScore).toBe(1)
    expect(parsed?.answersByQuestion.get("q-1")?.isCorrect).toBe(true)
  })
})

describe("parseSectionBlindReviewFromMetadata", () => {
  it("parses section blind review answers and raw score from session metadata", () => {
    const parsed = parseSectionBlindReviewFromMetadata({
      sectionBlindReviewCompletedAt: "2026-01-02T00:00:00Z",
      sectionBlindReviewRawScore: 2,
      sectionBlindReviewAnswers: [
        { questionId: "q-1", selectedAnswer: "B", isCorrect: true },
        { questionId: "q-2", selectedAnswer: "C", isCorrect: true },
      ],
    })

    expect(parsed?.rawScore).toBe(2)
    expect(parsed?.answersByQuestion.get("q-2")?.isCorrect).toBe(true)
  })
})

describe("resolveSectionBlindReviewForResults", () => {
  it("prefers completed metadata over API answer snapshots", () => {
    const resolved = resolveSectionBlindReviewForResults({
      sessionMetadata: {
        sectionBlindReviewCompletedAt: "2026-01-02T00:00:00Z",
        sectionBlindReviewRawScore: 1,
        sectionBlindReviewAnswers: [
          { questionId: "q-1", selectedAnswer: "B", isCorrect: true },
        ],
      },
      blindReviewAnswers: [{ questionId: "q-1", isCorrect: false }],
      blindReviewRawScore: 0,
    })

    expect(resolved.rawScore).toBe(1)
    expect(resolved.answersByQuestion?.get("q-1")?.isCorrect).toBe(true)
  })

  it("falls back to API snapshots when prep-test blind review changed answer events", () => {
    const resolved = resolveSectionBlindReviewForResults({
      sessionMetadata: {},
      blindReviewAnswers: [
        { questionId: "q-1", isCorrect: true, selectedAnswer: "B" },
        { questionId: "q-2", isCorrect: false, selectedAnswer: "A" },
      ],
      blindReviewRawScore: 1,
    })

    expect(resolved.rawScore).toBe(1)
    expect(resolved.answersByQuestion?.get("q-1")?.isCorrect).toBe(true)
    expect(resolved.answersByQuestion?.get("q-2")?.isCorrect).toBe(false)
  })

  it("returns null when no blind review was completed or recorded", () => {
    expect(
      resolveSectionBlindReviewForResults({
        sessionMetadata: {},
        blindReviewAnswers: [],
      }),
    ).toEqual({ rawScore: null, answersByQuestion: null })
  })
})

describe("applyActualFallbackToBlindReview", () => {
  it("fills skipped Blind Review answers from Actual and recomputes raw score", () => {
    const actualByQuestion = new Map([
      ["q-1", { selectedAnswer: "A", isCorrect: false }],
      ["q-2", { selectedAnswer: "B", isCorrect: true }],
    ])
    const blindReviewAnswersByQuestion = new Map([
      ["q-1", { selectedAnswer: "C", isCorrect: false }],
    ])

    const result = applyActualFallbackToBlindReview({
      questionIds: ["q-1", "q-2"],
      actualByQuestion,
      blindReviewAnswersByQuestion,
    })

    expect(result.rawScore).toBe(1)
    expect(result.answersByQuestion?.get("q-1")?.selectedAnswer).toBe("C")
    expect(result.answersByQuestion?.get("q-2")?.selectedAnswer).toBe("B")
    expect(result.answersByQuestion?.get("q-2")?.isCorrect).toBe(true)
  })

  it("keeps Blind Review answer when Actual was skipped", () => {
    const result = applyActualFallbackToBlindReview({
      questionIds: ["q-1"],
      actualByQuestion: new Map(),
      blindReviewAnswersByQuestion: new Map([["q-1", { selectedAnswer: "B", isCorrect: true }]]),
    })

    expect(result.rawScore).toBe(1)
    expect(result.answersByQuestion?.get("q-1")?.isCorrect).toBe(true)
  })

  it("returns null when Blind Review was not completed", () => {
    expect(
      applyActualFallbackToBlindReview({
        questionIds: ["q-1"],
        actualByQuestion: new Map([["q-1", { selectedAnswer: "A", isCorrect: true }]]),
        blindReviewAnswersByQuestion: null,
      }),
    ).toEqual({ rawScore: null, answersByQuestion: null })
  })
})
