import { describe, expect, it } from "vitest"

import {
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

  it("formats diagnostic date labels", () => {
    expect(formatDiagnosticDateLabel("2026-10-04T12:00:00.000Z")).toMatch(/^\d{1,2}\/\d{1,2}$/)
  })

  it("maps intent titles", () => {
    expect(getDiagnosticIntentTitle("mini")).toBe("Mini Diagnostic")
    expect(getDiagnosticIntentTitle("quick")).toBe("Quick Diagnostic")
    expect(getDiagnosticIntentTitle("full")).toBe("Full Diagnostic")
  })
})
