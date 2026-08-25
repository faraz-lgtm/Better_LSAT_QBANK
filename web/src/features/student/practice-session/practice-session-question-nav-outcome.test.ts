import { describe, expect, it } from "vitest"

import { resolvePracticeSessionQuestionNavOutcome } from "@/features/student/practice-session/practice-session-question-nav-outcome"

describe("resolvePracticeSessionQuestionNavOutcome", () => {
  it("marks missing or blank answers as unanswered", () => {
    expect(resolvePracticeSessionQuestionNavOutcome(undefined)).toBe("unanswered")
    expect(resolvePracticeSessionQuestionNavOutcome(null)).toBe("unanswered")
    expect(resolvePracticeSessionQuestionNavOutcome({ selectedAnswer: "  ", isCorrect: false })).toBe(
      "unanswered",
    )
  })

  it("marks scored answers as correct or incorrect", () => {
    expect(
      resolvePracticeSessionQuestionNavOutcome({ selectedAnswer: "A", isCorrect: true }),
    ).toBe("correct")
    expect(
      resolvePracticeSessionQuestionNavOutcome({ selectedAnswer: "B", isCorrect: false }),
    ).toBe("incorrect")
  })
})
