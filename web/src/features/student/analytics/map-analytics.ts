import type {
  AnalyticsOverview,
  PracticeSessionSummary,
  PrepTestSessionDetail,
  PriorityRow,
  TrajectoryPoint,
} from "@/lib/api/analytics"
import type {
  AnalyticsSection,
  AnalyticsStat,
  Difficulty,
  QuestionTypeRow,
  ScoreProgressPoint,
} from "@/features/student/lib/mock-analytics"
import type { DrillRecord } from "@/features/student/lib/mock-analytics-drills"
import type { PrepTestHistoryEntry, PrepTestRecord } from "@/features/student/lib/mock-analytics-preptests"
import type { DrillType } from "@/features/student/lib/mock-analytics-drills"

function formatSigned(n: number): string {
  if (n > 0) return `+${n}`
  return String(n)
}

function ordinal(n: number): string {
  const rounded = Math.round(n)
  const v = rounded % 100
  if (v >= 11 && v <= 13) return `${rounded}th`
  switch (rounded % 10) {
    case 1:
      return `${rounded}st`
    case 2:
      return `${rounded}nd`
    case 3:
      return `${rounded}rd`
    default:
      return `${rounded}th`
  }
}

export function formatPrepTestChartLabel(prepTestTitle: string, moduleId: string | null): string {
  const moduleMatch = moduleId?.match(/^LSAC(\d+)$/i)
  if (moduleMatch) return `PT ${moduleMatch[1]}`

  const trimmed = prepTestTitle.trim()
  const ptMatch = trimmed.match(/^PT\s*(\d+)/i)
  if (ptMatch) return `PT ${ptMatch[1]}`
  const prepMatch = trimmed.match(/PrepTest\s+(\d+)/i)
  if (prepMatch) return `PT ${prepMatch[1]}`
  const numMatch = trimmed.match(/\b(\d{2,3})\b/)
  if (numMatch) return `PT ${numMatch[1]}`

  return trimmed.length > 10 ? trimmed.slice(0, 10) : trimmed || "PT"
}

/** Compact `PT158` label for PrepTest history rows (Figma). */
export function formatPrepTestHistoryLabel(
  prepTestTitle: string | null | undefined,
  prepTestId?: string | null,
): string {
  const moduleId = prepTestId?.match(/^LSAC\d+$/i) ? prepTestId : null
  return formatPrepTestChartLabel(prepTestTitle ?? "", moduleId).replace(/^PT\s+/i, "PT")
}

function numericToDifficulty(n: number | null): Difficulty {
  if (n == null || n <= 1) return "Easiest"
  if (n === 2) return "Easy"
  if (n === 3) return "Medium"
  if (n === 4) return "Hard"
  return "Hardest"
}

export function mapOverviewToHeadlineStats(overview: AnalyticsOverview): AnalyticsStat[] {
  const stats: AnalyticsStat[] = []
  if (overview.bestScaledScore != null) {
    stats.push({
      id: "best-score",
      label: "BEST SCORE",
      value: String(overview.bestScaledScore),
      accent: "#0d47a1",
      caption:
        overview.bestPercentile != null ? `PERCENTILE: ${ordinal(overview.bestPercentile)}` : undefined,
    })
  }
  if (overview.averageScaledScore != null) {
    stats.push({
      id: "average-score",
      label: "AVERAGE SCORE",
      value: String(overview.averageScaledScore),
      accent: "#5463a9",
      caption:
        overview.averagePercentile != null
          ? `PERCENTILE: ${ordinal(overview.averagePercentile)}`
          : undefined,
    })
  }
  if (stats.length === 0) {
    stats.push({
      id: "best-score",
      label: "BEST SCORE",
      value: "—",
      accent: "#0d47a1",
    })
    stats.push({
      id: "average-score",
      label: "AVERAGE SCORE",
      value: "—",
      accent: "#5463a9",
    })
  }
  return stats
}

export function mapOverviewToSecondaryStats(overview: AnalyticsOverview): AnalyticsStat[] {
  return [
    {
      id: "avg-lr",
      label: "AVERAGE LR",
      value:
        overview.averageLrMissedPerPrepTest != null
          ? formatSigned(-Math.round(overview.averageLrMissedPerPrepTest))
          : "—",
      accent: "#00bc54",
    },
    {
      id: "avg-rc",
      label: "AVERAGE RC",
      value:
        overview.averageRcMissedPerPrepTest != null
          ? formatSigned(-Math.round(overview.averageRcMissedPerPrepTest))
          : "—",
      accent: "#0bbcc9",
    },
    {
      id: "drilled",
      label: "QUESTIONS DRILLED",
      value: String(overview.totalDrillQuestionsAnswered),
      accent: "#116b97",
    },
    {
      id: "accuracy",
      label: "DRILLING ACCURACY",
      value: overview.drillAccuracyPct != null ? `${overview.drillAccuracyPct}%` : "—",
      accent: "#956321",
    },
  ]
}

function scaledToChartValue(scaled: number | null, raw: number | null): number {
  if (scaled != null) return Math.round((scaled / 180) * 100)
  if (raw != null) return Math.min(100, Math.max(0, raw))
  return 0
}

export function mapTrajectoryToScoreProgress(points: TrajectoryPoint[]): ScoreProgressPoint[] {
  return points.map((p) => {
    const label = formatPrepTestChartLabel(p.prepTestTitle, p.moduleId)
    const regular = scaledToChartValue(
      p.regularScaledScore ?? p.scaledScore,
      p.regularRawScore ?? p.rawScore,
    )
    const blind = scaledToChartValue(p.blindReviewScaledScore, p.blindReviewRawScore)
    return {
      test: label,
      regular,
      blindReview: blind > 0 ? blind : regular,
    }
  })
}

const SECTION_STYLE: Record<
  "LR" | "RC",
  { badgeBg: string; badgeColor: string; accentBar: string; title: string }
> = {
  LR: {
    badgeBg: "#eafff4",
    badgeColor: "#00bc54",
    accentBar: "#00bc54",
    title: "Logical Reasoning",
  },
  RC: {
    badgeBg: "#e5fdff",
    badgeColor: "#0bbcc9",
    accentBar: "#0bbcc9",
    title: "Reading Comprehension",
  },
}

export function mapPrioritiesToSections(priorities: PriorityRow[]): AnalyticsSection[] {
  const bySection = new Map<"LR" | "RC", QuestionTypeRow[]>()
  for (const p of priorities) {
    if (p.sectionType !== "LR" && p.sectionType !== "RC") continue
    const rows = bySection.get(p.sectionType) ?? []
    rows.push({
      id: p.questionTypeId,
      title: p.name,
      averagePerTest: p.averagePerTest ?? 0,
      difficulty: numericToDifficulty(p.difficulty),
      accuracyPct: p.accuracyPct,
      goalPct: p.goalAccuracy ?? 86,
      reviewCount: p.reviewCount,
    })
    bySection.set(p.sectionType, rows)
  }
  return (["LR", "RC"] as const)
    .map((id) => {
      const rows = bySection.get(id)
      if (!rows?.length) return null
      const style = SECTION_STYLE[id]
      return {
        id,
        title: style.title,
        badgeBg: style.badgeBg,
        badgeColor: style.badgeColor,
        accentBar: style.accentBar,
        rows,
      }
    })
    .filter((s): s is AnalyticsSection => s != null)
}

export function mapSessionToDrillRecord(s: PracticeSessionSummary): DrillRecord | null {
  if (s.kind !== "DRILL" || !s.completedAt) return null
  const meta = s.metadata
  const typeId = typeof meta.questionTypeId === "string" ? meta.questionTypeId : "unknown"
  const questionIds = Array.isArray(meta.questionIds) ? meta.questionIds : []
  const total = questionIds.length > 0 ? questionIds.length : s.rawScore != null ? s.rawScore : 0
  const correct = s.rawScore ?? 0
  return {
    id: s.id,
    typeId,
    takenAt: s.completedAt,
    questionsTotal: total > 0 ? total : Math.max(correct, 1),
    questionsCorrect: correct,
    durationSeconds: 600,
    ptEquivalentScore: s.scaledScore ?? 150,
  }
}

export function buildDrillTypesFromPriorities(priorities: PriorityRow[]): DrillType[] {
  return priorities
    .filter((p): p is PriorityRow & { sectionType: "LR" | "RC" } => p.sectionType === "LR" || p.sectionType === "RC")
    .map((p) => ({
      id: p.questionTypeId,
      label: p.name,
      section: p.sectionType,
    }))
}

export function mapSessionToPrepTestRecord(s: PracticeSessionSummary): PrepTestRecord | null {
  if (s.kind !== "PREPTEST" || !s.completedAt) return null
  const numMatch = s.prepTestTitle?.match(/\d+/)
  const scaled = s.scaledScore ?? s.rawScore ?? 0
  const br = s.blindReviewScaledScore ?? s.blindReviewRawScore ?? scaled
  return {
    id: s.id,
    prepTestNumber: numMatch ? Number.parseInt(numMatch[0]!, 10) : 0,
    takenAt: s.completedAt,
    bookmarked: s.bookmarked,
    lrCorrect: 0,
    lrMax: 51,
    rcCorrect: s.rawScore ?? 0,
    rcMax: 27,
    scaledScore: scaled,
    percentile: s.percentile ?? 0,
    blindReviewScaled: br,
    blindReviewPercentile: s.blindReviewPercentile ?? s.percentile ?? 0,
  }
}

export function mapPrepTestSessionToHistoryEntry(s: PracticeSessionSummary): PrepTestHistoryEntry | null {
  if (s.kind !== "PREPTEST" || !s.completedAt) return null
  const score = s.scaledScore ?? s.rawScore ?? 0
  const d = new Date(s.completedAt)
  const dateLabel = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
  const br = s.blindReviewScaledScore ?? s.blindReviewRawScore ?? score
  return {
    id: s.id,
    testLabel: formatPrepTestHistoryLabel(s.prepTestTitle, s.prepTestId),
    dateLabel,
    bookmarked: s.bookmarked,
    score,
    scoreMax: 180,
    blindReviewScore: br,
    blindReviewMax: 180,
  }
}

export function filterTrajectoryByRange(
  points: TrajectoryPoint[],
  cutoffIso: string | null,
): TrajectoryPoint[] {
  if (!cutoffIso) return points
  const cutoff = new Date(cutoffIso).getTime()
  return points.filter((p) => new Date(p.completedAt).getTime() >= cutoff)
}

export { numericToDifficulty }

export type { PrepTestSessionDetail }
