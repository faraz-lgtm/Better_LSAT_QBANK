import { describe, expect, it } from "vitest"

import { buildGuestDiagnosticAnswerState } from "@/features/guest/diagnostic/guest-diagnostic-answer-state"
import { createMiniDiagnosticQuestions } from "@/features/guest/diagnostic/mini-diagnostic-content"

describe("guest diagnostic answer state", () => {
  it("grades each mini question against its own correct answer", () => {
    const questions = createMiniDiagnosticQuestions()
    expect(buildGuestDiagnosticAnswerState(questions[0]!, "C").isCorrect).toBe(true)
    expect(buildGuestDiagnosticAnswerState(questions[0]!, "A").isCorrect).toBe(false)
    expect(buildGuestDiagnosticAnswerState(questions[1]!, "B").isCorrect).toBe(true)
    expect(buildGuestDiagnosticAnswerState(questions[6]!, "A").isCorrect).toBe(true)
    expect(buildGuestDiagnosticAnswerState(questions[9]!, "D").isCorrect).toBe(true)
  })
})
