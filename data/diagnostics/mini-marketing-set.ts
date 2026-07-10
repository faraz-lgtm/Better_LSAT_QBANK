import { MINI_DIAGNOSTIC_QUESTIONS } from "./mini-marketing-questions.ts"
import type { MiniDiagnosticMarketingSet, MiniDiagnosticScoreRange } from "./mini-marketing-types.ts"

/** Marketing mini diagnostic: 10 LR questions, 13 minutes. Maps raw correct count → projected LSAT range. */
export const MINI_DIAGNOSTIC_SCORE_RANGES: MiniDiagnosticScoreRange[] = [
  { correctCount: 0, scaledLow: 120, scaledHigh: 126, percentileLow: 0, percentileHigh: 8 },
  { correctCount: 1, scaledLow: 127, scaledHigh: 133, percentileLow: 8, percentileHigh: 15 },
  { correctCount: 2, scaledLow: 134, scaledHigh: 140, percentileLow: 15, percentileHigh: 24 },
  { correctCount: 3, scaledLow: 141, scaledHigh: 147, percentileLow: 24, percentileHigh: 35 },
  { correctCount: 4, scaledLow: 148, scaledHigh: 154, percentileLow: 35, percentileHigh: 48 },
  { correctCount: 5, scaledLow: 155, scaledHigh: 161, percentileLow: 48, percentileHigh: 60 },
  { correctCount: 6, scaledLow: 162, scaledHigh: 167, percentileLow: 60, percentileHigh: 72 },
  { correctCount: 7, scaledLow: 168, scaledHigh: 172, percentileLow: 72, percentileHigh: 82 },
  { correctCount: 8, scaledLow: 173, scaledHigh: 176, percentileLow: 82, percentileHigh: 90 },
  { correctCount: 9, scaledLow: 177, scaledHigh: 179, percentileLow: 90, percentileHigh: 96 },
  { correctCount: 10, scaledLow: 180, scaledHigh: 180, percentileLow: 96, percentileHigh: 99 },
]

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
