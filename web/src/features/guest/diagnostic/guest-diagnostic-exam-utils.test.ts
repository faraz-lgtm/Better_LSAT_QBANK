import { describe, expect, it } from "vitest"

import {
  choiceIndexFromAnswer,
  estimateGuestDiagnosticPercentile,
  estimateGuestDiagnosticScaledScore,
  isGuestDiagnosticMockCorrectChoice,
  resolveGuestDiagnosticPassageHtml,
} from "@/features/guest/diagnostic/guest-diagnostic-exam-utils"

describe("guest diagnostic exam utils", () => {
  const choices = [
    { id: "A", index: 0, text: "A" },
    { id: "B", index: 1, text: "B" },
    { id: "C", index: 2, text: "C" },
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

  it("scores mock correct choice B only", () => {
    expect(isGuestDiagnosticMockCorrectChoice("B")).toBe(true)
    expect(isGuestDiagnosticMockCorrectChoice("A")).toBe(false)
  })

  it("estimates scaled score and percentile from ratio", () => {
    expect(estimateGuestDiagnosticScaledScore(0, 10)).toBe(120)
    expect(estimateGuestDiagnosticScaledScore(10, 10)).toBe(180)
    expect(estimateGuestDiagnosticPercentile(5, 10)).toBe(49.5)
  })
})
