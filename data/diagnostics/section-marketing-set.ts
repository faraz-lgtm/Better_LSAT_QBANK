import { percentileForScaledScore } from "./lsat-scaled-score-percentiles.ts"
import { scaledRangeForIncorrectOnSection } from "./lsat-diagnostic-score-conversion.ts"
import type { MiniDiagnosticQuestion, MiniDiagnosticScoreRange } from "./mini-marketing-types.ts"

export const SECTION_DIAGNOSTIC_QUESTION_COUNT = 25

function withPercentilesFromScaled(range: {
  correctCount: number
  scaledLow: number
  scaledHigh: number
}): MiniDiagnosticScoreRange {
  return {
    ...range,
    percentileLow: percentileForScaledScore(range.scaledLow),
    percentileHigh: percentileForScaledScore(range.scaledHigh),
  }
}

/**
 * Map section performance → projected scaled LSAT band.
 *
 * Uses incorrect count (0–25) projected onto the Apr 2025 full-test conversion
 * (77 scored Q → 120–180). Passing `correctCount` is converted as `25 − correct`.
 */
export function resolveSectionDiagnosticScoreRange(correctCount: number): MiniDiagnosticScoreRange {
  const clampedCorrect = Math.min(
    Math.max(Math.floor(correctCount), 0),
    SECTION_DIAGNOSTIC_QUESTION_COUNT,
  )
  const incorrect = SECTION_DIAGNOSTIC_QUESTION_COUNT - clampedCorrect
  const { scaledLow, scaledHigh } = scaledRangeForIncorrectOnSection(
    incorrect,
    SECTION_DIAGNOSTIC_QUESTION_COUNT,
  )
  return withPercentilesFromScaled({
    correctCount: clampedCorrect,
    scaledLow,
    scaledHigh,
  })
}

export const SECTION_DIAGNOSTIC_MARKETING_META = {
  intentId: "quick" as const,
  moduleId: "DIAG-SEC",
  moduleName: "Section Diagnostic — Marketing",
  sectionId: "DIAG-SEC-LR-1",
  title: "Section Diagnostic for Marketing",
  timeMinutes: 35,
  questionCount: SECTION_DIAGNOSTIC_QUESTION_COUNT,
}

export function buildSectionDiagnosticMarketingSet(questions: MiniDiagnosticQuestion[]) {
  return {
    ...SECTION_DIAGNOSTIC_MARKETING_META,
    questions,
    scoreRanges: Array.from({ length: SECTION_DIAGNOSTIC_QUESTION_COUNT + 1 }, (_, correctCount) =>
      resolveSectionDiagnosticScoreRange(correctCount),
    ),
  }
}

export function formatSectionDiagnosticScoreRange(range: MiniDiagnosticScoreRange): string {
  if (range.scaledLow === range.scaledHigh) return String(range.scaledLow)
  return `${range.scaledLow}–${range.scaledHigh}`
}

export function formatSectionDiagnosticPercentileRange(range: MiniDiagnosticScoreRange): string {
  const low = range.percentileLow % 1 === 0 ? String(range.percentileLow) : range.percentileLow.toFixed(1)
  const high =
    range.percentileHigh % 1 === 0 ? String(range.percentileHigh) : range.percentileHigh.toFixed(1)
  if (low === high) return low
  return `${low}–${high}`
}
