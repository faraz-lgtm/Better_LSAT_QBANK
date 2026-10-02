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
    // 3/10 correct = 7 incorrect → Apr 2025 projection
    expect(result.scaledScoreLabel).toBe("120–142")
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
    // 2/10 correct = 8 incorrect → Apr 2025 projection
    expect(result.scaledScoreLabel).toBe("120–134")
    expect(result.percentileLabel).toBe("0–4.4")
    expect(result.percentileLow).toBe(0)
    expect(result.percentileHigh).toBe(4.38)
    expect(result.outcomes.filter((o) => o.isCorrect)).toHaveLength(2)
  })

  it("treats unanswered questions as incorrect", () => {
    const questions = createMiniDiagnosticQuestions().slice(0, 2)
    const result = buildGuestDiagnosticResultFromAnswers("mini", questions, {})
    expect(result.correctCount).toBe(0)
    expect(result.scaledScoreLabel).toBe("120–124")
  })

  it("maps section diagnostic incorrect count onto LSAT conversion bands", () => {
    const questions = Array.from({ length: 25 }, (_, index) => ({
      id: `section-diag-q${index + 1}`,
      questionNumber: index + 1,
      stimulusText: null,
      stemText: "stem",
      passage: null,
      correctChoiceId: "C",
      choices: [{ id: "C", index: 0, text: "C", explanationHtml: null }],
    }))
    // 18/25 correct = 7 incorrect → ~160 on Apr 2025 curve
    const answersByQuestion = Object.fromEntries(
      questions.slice(0, 18).map((q) => [q.id, buildGuestDiagnosticAnswerState(q, "C")]),
    )

    const result = buildGuestDiagnosticResultFromAnswers("quick", questions, answersByQuestion)

    expect(result.correctCount).toBe(18)
    expect(result.scaledScoreLabel).toBe("158–162")
    expect(result.percentileLabel).toBe("66.4–79")
    expect(result.percentileLow).toBe(66.38)
    expect(result.percentileHigh).toBe(79)
  })

  it("recomputes scaled bands when reading stored attempts (conversion updates)", () => {
    const stale = {
      ...buildDefaultGuestDiagnosticResult("quick"),
      correctCount: 18,
      questionCount: 25,
      // Intentionally stale pre-conversion labels
      scaledScore: 999,
      scaledScoreLow: 1,
      scaledScoreHigh: 2,
      scaledScoreLabel: "stale",
    }
    localStorage.setItem(DIAGNOSTIC_ATTEMPT_HISTORY_STORAGE_KEY, JSON.stringify([stale]))

    const loaded = getDiagnosticAttempt(stale.id)
    expect(loaded?.scaledScoreLabel).toBe("158–162")
    expect(loaded?.scaledScoreLow).toBe(158)
    expect(loaded?.scaledScoreHigh).toBe(162)
  })

  it("formats diagnostic date labels", () => {
    expect(formatDiagnosticDateLabel("2026-10-04T12:00:00.000Z")).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/)
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
