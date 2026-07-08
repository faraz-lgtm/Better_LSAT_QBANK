import { describe, expect, it } from "vitest"

import { createGuestDiagnosticPreviewQuestions } from "@/features/guest/diagnostic/guest-diagnostic-exam-mock-data"
import {
  buildGuestDiagnosticAnswerState,
  buildGuestDiagnosticResultFromAnswers,
  buildDefaultGuestDiagnosticResult,
  formatDiagnosticDateLabel,
  getDiagnosticIntentTitle,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"

describe("guest diagnostic result storage", () => {
  it("builds mini diagnostic demo result with 3 correct answers", () => {
    const result = buildDefaultGuestDiagnosticResult("mini")
    expect(result.questionCount).toBe(10)
    expect(result.correctCount).toBe(3)
    expect(result.scaledScore).toBe(167)
    expect(result.outcomes.filter((o) => o.isCorrect)).toHaveLength(3)
  })

  it("builds result from actual answers", () => {
    const questions = createGuestDiagnosticPreviewQuestions(3)
    const answersByQuestion = {
      [questions[0].id]: buildGuestDiagnosticAnswerState("B"),
      [questions[1].id]: buildGuestDiagnosticAnswerState("A"),
      [questions[2].id]: buildGuestDiagnosticAnswerState("B"),
    }

    const result = buildGuestDiagnosticResultFromAnswers("mini", questions, answersByQuestion)

    expect(result.questionCount).toBe(3)
    expect(result.correctCount).toBe(2)
    expect(result.outcomes).toEqual([
      { questionId: questions[0].id, isCorrect: true },
      { questionId: questions[1].id, isCorrect: false },
      { questionId: questions[2].id, isCorrect: true },
    ])
    expect(result.scaledScore).toBe(160)
    expect(result.percentile).toBeGreaterThan(0)
  })

  it("treats unanswered questions as incorrect", () => {
    const questions = createGuestDiagnosticPreviewQuestions(2)
    const result = buildGuestDiagnosticResultFromAnswers("mini", questions, {})
    expect(result.correctCount).toBe(0)
    expect(result.outcomes.every((outcome) => !outcome.isCorrect)).toBe(true)
  })

  it("formats diagnostic date labels", () => {
    expect(formatDiagnosticDateLabel("2026-10-04T12:00:00.000Z")).toMatch(/^\d{1,2}\/\d{1,2}$/)
  })

  it("maps intent titles", () => {
    expect(getDiagnosticIntentTitle("mini")).toBe("Mini Diagnostic")
    expect(getDiagnosticIntentTitle("quick")).toBe("Quick Diagnostic")
    expect(getDiagnosticIntentTitle("full")).toBe("Full Diagnostic")
  })
})
