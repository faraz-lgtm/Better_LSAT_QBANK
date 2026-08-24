import { describe, expect, it } from "vitest"

import { createMiniDiagnosticQuestions } from "@/features/guest/diagnostic/mini-diagnostic-content"
import { buildGuestDiagnosticAnswerState } from "@/features/guest/diagnostic/guest-diagnostic-answer-state"
import {
  buildGuestDiagnosticResultFromAnswers,
  buildDefaultGuestDiagnosticResult,
  formatDiagnosticDateLabel,
  getDiagnosticIntentTitle,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"

describe("guest diagnostic result storage", () => {
  it("builds mini diagnostic demo result with score range", () => {
    const result = buildDefaultGuestDiagnosticResult("mini")
    expect(result.questionCount).toBe(10)
    expect(result.correctCount).toBe(3)
    expect(result.scaledScoreLabel).toBe("141–147")
    expect(result.outcomes[0]?.questionId).toBe("mini-diag-q1")
  })

  it("builds result from actual mini answers with score range", () => {
    const questions = createMiniDiagnosticQuestions()
    const answersByQuestion = {
      [questions[0]!.id]: buildGuestDiagnosticAnswerState(questions[0]!, "C"),
      [questions[1]!.id]: buildGuestDiagnosticAnswerState(questions[1]!, "A"),
      [questions[2]!.id]: buildGuestDiagnosticAnswerState(questions[2]!, "C"),
    }

    const result = buildGuestDiagnosticResultFromAnswers("mini", questions, answersByQuestion)

    expect(result.questionCount).toBe(10)
    expect(result.correctCount).toBe(2)
    expect(result.scaledScoreLabel).toBe("134–140")
    expect(result.percentileLabel).toBe("15–24")
    expect(result.outcomes.filter((o) => o.isCorrect)).toHaveLength(2)
  })

  it("treats unanswered questions as incorrect", () => {
    const questions = createMiniDiagnosticQuestions().slice(0, 2)
    const result = buildGuestDiagnosticResultFromAnswers("mini", questions, {})
    expect(result.correctCount).toBe(0)
    expect(result.scaledScoreLabel).toBe("120–126")
  })

  it("formats diagnostic date labels", () => {
    expect(formatDiagnosticDateLabel("2026-10-04T12:00:00.000Z")).toMatch(/^\d{1,2}\/\d{1,2}$/)
  })

  it("maps intent titles", () => {
    expect(getDiagnosticIntentTitle("mini")).toBe("Mini Diagnostic")
    expect(getDiagnosticIntentTitle("quick")).toBe("Full Section Diagnostic")
    expect(getDiagnosticIntentTitle("full")).toBe("Full Diagnostic")
  })
})
