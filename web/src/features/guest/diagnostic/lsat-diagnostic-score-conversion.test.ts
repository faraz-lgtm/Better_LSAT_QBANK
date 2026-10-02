import { describe, expect, it } from "vitest"

import {
  scaledRangeForIncorrectOnSection,
  scaledScoreForIncorrectOnSection,
  scaledScoreForRaw,
} from "@data/diagnostics/lsat-diagnostic-score-conversion.ts"
import {
  formatMiniDiagnosticScoreRange,
  resolveMiniDiagnosticScoreRange,
} from "@data/diagnostics/mini-marketing-set.ts"
import {
  formatSectionDiagnosticScoreRange,
  resolveSectionDiagnosticScoreRange,
} from "@data/diagnostics/section-marketing-set.ts"

describe("lsat diagnostic score conversion (Apr 2025 / 0–25 incorrect)", () => {
  it("maps full-test raw scores onto the 120–180 curve", () => {
    expect(scaledScoreForRaw(77)).toBe(180)
    expect(scaledScoreForRaw(69)).toBe(170)
    expect(scaledScoreForRaw(55)).toBe(160)
    expect(scaledScoreForRaw(0)).toBe(120)
  })

  it("projects section incorrect counts (0–25) onto scaled scores", () => {
    expect(scaledScoreForIncorrectOnSection(0, 25)).toBe(180)
    expect(scaledScoreForIncorrectOnSection(7, 25)).toBe(160)
    expect(scaledScoreForIncorrectOnSection(25, 25)).toBe(120)
  })

  it("resolves section bands from correct count via incorrect projection", () => {
    // 25/25 correct = 0 incorrect → top band
    expect(formatSectionDiagnosticScoreRange(resolveSectionDiagnosticScoreRange(25))).toBe("177–180")
    // 18/25 correct = 7 incorrect → ~160
    expect(formatSectionDiagnosticScoreRange(resolveSectionDiagnosticScoreRange(18))).toBe("158–162")
    // 0/25 correct = 25 incorrect → floor
    expect(formatSectionDiagnosticScoreRange(resolveSectionDiagnosticScoreRange(0))).toBe("120–124")
  })

  it("resolves mini bands from the same conversion curve", () => {
    expect(formatMiniDiagnosticScoreRange(resolveMiniDiagnosticScoreRange(10))).toBe("170–180")
    expect(formatMiniDiagnosticScoreRange(resolveMiniDiagnosticScoreRange(5))).toBe("142–153")
    expect(formatMiniDiagnosticScoreRange(resolveMiniDiagnosticScoreRange(0))).toBe("120–124")
  })

  it("keeps low ≤ high for every miss count", () => {
    for (let incorrect = 0; incorrect <= 25; incorrect++) {
      const range = scaledRangeForIncorrectOnSection(incorrect, 25)
      expect(range.scaledLow).toBeLessThanOrEqual(range.scaledHigh)
      expect(range.scaledLow).toBeGreaterThanOrEqual(120)
      expect(range.scaledHigh).toBeLessThanOrEqual(180)
    }
  })
})
