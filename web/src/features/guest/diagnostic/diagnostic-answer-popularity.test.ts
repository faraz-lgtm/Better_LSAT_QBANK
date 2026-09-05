import { describe, expect, it } from "vitest"

import { buildDiagnosticAnswerPopularity } from "@/features/guest/diagnostic/diagnostic-answer-popularity"

describe("buildDiagnosticAnswerPopularity", () => {
  it("always returns A–E with percentages that sum near 100", () => {
    const rows = buildDiagnosticAnswerPopularity("mini-diag-q1", "C", [])
    expect(rows.map((r) => r.letter)).toEqual(["A", "B", "C", "D", "E"])
    expect(rows.every((r) => r.pct > 0)).toBe(true)
    expect(rows.reduce((sum, r) => sum + r.pct, 0)).toBe(100)
    expect(rows.find((r) => r.letter === "C")?.highlight).toBe(true)
  })

  it("is stable for the same question id", () => {
    const a = buildDiagnosticAnswerPopularity("mini-diag-q2", "B")
    const b = buildDiagnosticAnswerPopularity("mini-diag-q2", "B")
    expect(a).toEqual(b)
  })
})
