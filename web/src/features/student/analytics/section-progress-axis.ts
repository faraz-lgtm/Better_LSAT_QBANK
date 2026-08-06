import type { PracticeSessionSummary } from "@/lib/api/analytics"
import { buildChartYAxisLabels } from "@/features/student/analytics/chart-y-axis"

const DEFAULT_SECTION_QUESTION_COUNT = {
  LR: 25,
  RC: 27,
} as const

function sessionSectionQuestionCount(
  session: Pick<PracticeSessionSummary, "metadata">,
  sectionType: "LR" | "RC",
): number {
  const meta = session.metadata
  if (typeof meta.questionCount === "number" && meta.questionCount > 0) {
    return Math.round(meta.questionCount)
  }
  if (Array.isArray(meta.questionIds) && meta.questionIds.length > 0) {
    return meta.questionIds.length
  }
  return DEFAULT_SECTION_QUESTION_COUNT[sectionType]
}

/**
 * Descending Y-axis ticks from the section question count down to 0.
 * Uses the actual max question count observed for that section when available.
 */
function buildSectionYAxisLabels(maxQuestionCount: number, tickCount = 6): number[] {
  return buildChartYAxisLabels(maxQuestionCount, 0, tickCount)
}

function resolveSectionChartMax(
  questionCounts: number[],
  rawScores: number[],
  sectionType: "LR" | "RC",
): number {
  const fromCounts = questionCounts.filter((n) => Number.isFinite(n) && n > 0)
  const fromScores = rawScores.filter((n) => Number.isFinite(n) && n > 0)
  const observed = Math.max(0, ...fromCounts, ...fromScores)
  return observed > 0 ? observed : DEFAULT_SECTION_QUESTION_COUNT[sectionType]
}

export {
  DEFAULT_SECTION_QUESTION_COUNT,
  buildSectionYAxisLabels,
  resolveSectionChartMax,
  sessionSectionQuestionCount,
}
