import { describe, expect, it } from "vitest"

import {
  choiceIndexFromAnswer,
  resolveGuestDiagnosticPassageHtml,
} from "@/features/guest/diagnostic/guest-diagnostic-exam-utils"
import {
  createMiniDiagnosticQuestions,
  formatMiniDiagnosticScoreRange,
  resolveMiniDiagnosticScoreRange,
} from "@/features/guest/diagnostic/mini-diagnostic-content"

describe("guest diagnostic exam utils", () => {
  const choices = [
    { id: "A" },
    { id: "B" },
    { id: "C" },
  ]

  it("maps selected answer letters to choice indices", () => {
    expect(choiceIndexFromAnswer(choices, "B")).toBe(1)
    expect(choiceIndexFromAnswer(choices, "b")).toBe(1)
    expect(choiceIndexFromAnswer(choices, "C")).toBe(2)
    expect(choiceIndexFromAnswer(choices, "Z")).toBeNull()
  })

  it("uses getRegionHtml for passage rendering", () => {
    const html = resolveGuestDiagnosticPassageHtml(
      (_key, base) => `<mark>${base}</mark>`,
      "passage-key",
      "Passage text",
    )
    expect(html).toBe("<mark>Passage text</mark>")
    expect(resolveGuestDiagnosticPassageHtml(() => "", "", "ignored")).toBe("")
  })

  it("loads ten unique mini diagnostic questions", () => {
    const questions = createMiniDiagnosticQuestions()
    expect(questions).toHaveLength(10)
    expect(new Set(questions.map((q) => q.id)).size).toBe(10)
    expect(questions[0]?.correctChoiceId).toBe("C")
    expect(questions[9]?.correctChoiceId).toBe("D")
  })

  it("resolves projected score ranges by correct count", () => {
    expect(formatMiniDiagnosticScoreRange(resolveMiniDiagnosticScoreRange(10))).toBe("173–180")
    expect(formatMiniDiagnosticScoreRange(resolveMiniDiagnosticScoreRange(5))).toBe("145–149")
  })

  it("maps scaled score bands to LSAT percentiles", () => {
    const band = resolveMiniDiagnosticScoreRange(3) // 135–139
    expect(band.percentileLow).toBe(5.16)
    expect(band.percentileHigh).toBe(9.81)
  })
})
