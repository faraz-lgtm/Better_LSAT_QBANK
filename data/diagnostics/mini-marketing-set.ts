import { percentileForScaledScore } from "./lsat-scaled-score-percentiles.ts"
import { scaledRangeForIncorrectOnSection } from "./lsat-diagnostic-score-conversion.ts"
import { MINI_DIAGNOSTIC_QUESTIONS } from "./mini-marketing-questions.ts"
import type { MiniDiagnosticMarketingSet, MiniDiagnosticScoreRange } from "./mini-marketing-types.ts"

export const MINI_DIAGNOSTIC_QUESTION_COUNT = 10

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
 * Mini diagnostic: 10 LR questions.
 * Maps incorrect count (0–10) → projected scaled LSAT band via Apr 2025 conversion
 * (same curve as section diagnostic; see `lsat-diagnostic-score-conversion.ts`).
 */
export function resolveMiniDiagnosticScoreRange(correctCount: number): MiniDiagnosticScoreRange {
  const clampedCorrect = Math.min(Math.max(Math.floor(correctCount), 0), MINI_DIAGNOSTIC_QUESTION_COUNT)
  const incorrect = MINI_DIAGNOSTIC_QUESTION_COUNT - clampedCorrect
  const { scaledLow, scaledHigh } = scaledRangeForIncorrectOnSection(
    incorrect,
    MINI_DIAGNOSTIC_QUESTION_COUNT,
  )
  return withPercentilesFromScaled({
    correctCount: clampedCorrect,
    scaledLow,
    scaledHigh,
  })
}

/** Marketing mini diagnostic score bands indexed by correct count (0–10). */
export const MINI_DIAGNOSTIC_SCORE_RANGES: MiniDiagnosticScoreRange[] = Array.from(
  { length: MINI_DIAGNOSTIC_QUESTION_COUNT + 1 },
  (_, correctCount) => resolveMiniDiagnosticScoreRange(correctCount),
)

export const MINI_DIAGNOSTIC_MARKETING_SET: MiniDiagnosticMarketingSet = {
  intentId: "mini",
  moduleId: "DIAG-MINI",
  moduleName: "Mini Diagnostic — Marketing",
  sectionId: "DIAG-MINI-LR-1",
  title: "Mini Diagnostic for Marketing",
  timeMinutes: 13,
  questionCount: MINI_DIAGNOSTIC_QUESTION_COUNT,
  questions: MINI_DIAGNOSTIC_QUESTIONS,
  scoreRanges: MINI_DIAGNOSTIC_SCORE_RANGES,
}

export function formatMiniDiagnosticScoreRange(range: MiniDiagnosticScoreRange): string {
  if (range.scaledLow === range.scaledHigh) return String(range.scaledLow)
  return `${range.scaledLow}–${range.scaledHigh}`
}

export function formatMiniDiagnosticPercentileRange(range: MiniDiagnosticScoreRange): string {
  const low = range.percentileLow % 1 === 0 ? String(range.percentileLow) : range.percentileLow.toFixed(1)
  const high = range.percentileHigh % 1 === 0 ? String(range.percentileHigh) : range.percentileHigh.toFixed(1)
  if (low === high) return low
  return `${low}–${high}`
}
