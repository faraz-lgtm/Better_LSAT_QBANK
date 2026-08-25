import { beforeEach, describe, expect, it } from "vitest"

import { createMiniDiagnosticQuestions } from "@/features/guest/diagnostic/mini-diagnostic-content"
import { buildGuestDiagnosticAnswerState } from "@/features/guest/diagnostic/guest-diagnostic-answer-state"
import {
  buildGuestDiagnosticResultFromAnswers,
  buildDefaultGuestDiagnosticResult,
  DIAGNOSTIC_ATTEMPT_HISTORY_STORAGE_KEY,
  formatDiagnosticDateLabel,
  getDiagnosticAttempt,
  getDiagnosticIntentTitle,
  GUEST_DIAGNOSTIC_RESULT_STORAGE_KEY,
  listDiagnosticHistoryBySection,
  writeGuestDiagnosticResult,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"

describe("guest diagnostic result storage", () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

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

  it("stores attempts in Mini and Full history with sequential numbers", () => {
    const miniA = writeGuestDiagnosticResult({
      ...buildDefaultGuestDiagnosticResult("mini"),
      completedAt: "2026-01-01T00:00:00.000Z",
    })
    const fullA = writeGuestDiagnosticResult({
      ...buildDefaultGuestDiagnosticResult("quick"),
      completedAt: "2026-01-02T00:00:00.000Z",
    })
    const miniB = writeGuestDiagnosticResult({
      ...buildDefaultGuestDiagnosticResult("mini"),
      completedAt: "2026-01-03T00:00:00.000Z",
    })

    expect(sessionStorage.getItem(GUEST_DIAGNOSTIC_RESULT_STORAGE_KEY)).toContain(miniB.id)
    expect(localStorage.getItem(DIAGNOSTIC_ATTEMPT_HISTORY_STORAGE_KEY)).toContain(miniA.id)

    const miniHistory = listDiagnosticHistoryBySection("mini")
    expect(miniHistory.map((row) => row.id)).toEqual([miniB.id, miniA.id])
    expect(miniHistory[0]?.diagnosticNumber).toBe(2)
    expect(miniHistory[1]?.diagnosticNumber).toBe(1)

    const fullHistory = listDiagnosticHistoryBySection("full")
    expect(fullHistory).toHaveLength(1)
    expect(fullHistory[0]?.id).toBe(fullA.id)
    expect(fullHistory[0]?.diagnosticNumber).toBe(1)
    expect(getDiagnosticAttempt(miniA.id)?.id).toBe(miniA.id)
  })
})
