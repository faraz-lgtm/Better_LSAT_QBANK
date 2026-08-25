import { percentileForScaledScore } from "./lsat-scaled-score-percentiles.ts"
import { MINI_DIAGNOSTIC_QUESTIONS } from "./mini-marketing-questions.ts"
import type { MiniDiagnosticMarketingSet, MiniDiagnosticScoreRange } from "./mini-marketing-types.ts"

/** Raw correct count → projected scaled LSAT range (marketing mini diagnostic). */
const MINI_DIAGNOSTIC_SCALED_RANGES: ReadonlyArray<{
  correctCount: number
  scaledLow: number
  scaledHigh: number
}> = [
  { correctCount: 0, scaledLow: 120, scaledHigh: 124 },
  { correctCount: 1, scaledLow: 125, scaledHigh: 129 },
  { correctCount: 2, scaledLow: 130, scaledHigh: 134 },
  { correctCount: 3, scaledLow: 135, scaledHigh: 139 },
  { correctCount: 4, scaledLow: 140, scaledHigh: 144 },
  { correctCount: 5, scaledLow: 145, scaledHigh: 149 },
  { correctCount: 6, scaledLow: 150, scaledHigh: 154 },
  { correctCount: 7, scaledLow: 155, scaledHigh: 160 },
  { correctCount: 8, scaledLow: 161, scaledHigh: 166 },
  { correctCount: 9, scaledLow: 167, scaledHigh: 172 },
  { correctCount: 10, scaledLow: 173, scaledHigh: 180 },
]

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

/** Marketing mini diagnostic: 10 LR questions, 13 minutes. Maps raw correct → scaled range → percentile range. */
export const MINI_DIAGNOSTIC_SCORE_RANGES: MiniDiagnosticScoreRange[] =
  MINI_DIAGNOSTIC_SCALED_RANGES.map(withPercentilesFromScaled)

export const MINI_DIAGNOSTIC_MARKETING_SET: MiniDiagnosticMarketingSet = {
  intentId: "mini",
  moduleId: "DIAG-MINI",
  moduleName: "Mini Diagnostic — Marketing",
  sectionId: "DIAG-MINI-LR-1",
  title: "Mini Diagnostic for Marketing",
  timeMinutes: 13,
  questionCount: 10,
  questions: MINI_DIAGNOSTIC_QUESTIONS,
  scoreRanges: MINI_DIAGNOSTIC_SCORE_RANGES,
}

export function resolveMiniDiagnosticScoreRange(correctCount: number): MiniDiagnosticScoreRange {
  const clamped = Math.min(Math.max(Math.floor(correctCount), 0), 10)
  return MINI_DIAGNOSTIC_SCORE_RANGES[clamped] ?? MINI_DIAGNOSTIC_SCORE_RANGES[0]!
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
