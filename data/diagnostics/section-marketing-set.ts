import type { MiniDiagnosticQuestion, MiniDiagnosticScoreRange } from "./mini-marketing-types.ts"
import { resolveMiniDiagnosticScoreRange } from "./mini-marketing-set.ts"

/** Map section raw correct (0–25) → projected scaled LSAT band via mini-equivalent score. */
export function resolveSectionDiagnosticScoreRange(correctCount: number): MiniDiagnosticScoreRange {
  const clamped = Math.min(Math.max(Math.floor(correctCount), 0), 25)
  const miniEquivalent = Math.round((clamped / 25) * 10)
  return resolveMiniDiagnosticScoreRange(miniEquivalent)
}

export const SECTION_DIAGNOSTIC_MARKETING_META = {
  intentId: "quick" as const,
  moduleId: "DIAG-SEC",
  moduleName: "Section Diagnostic — Marketing",
  sectionId: "DIAG-SEC-LR-1",
  title: "Section Diagnostic for Marketing",
  timeMinutes: 35,
  questionCount: 25,
}

export function buildSectionDiagnosticMarketingSet(questions: MiniDiagnosticQuestion[]) {
  return {
    ...SECTION_DIAGNOSTIC_MARKETING_META,
    questions,
    scoreRanges: Array.from({ length: 26 }, (_, correctCount) =>
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
