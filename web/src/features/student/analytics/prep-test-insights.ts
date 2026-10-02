import type {
  PrepTestRecord,
  PrepTestSectionAccuracy,
} from "@/features/student/lib/mock-analytics-preptests"

export type { PrepTestSectionAccuracy }

export type PrepTestInsightStats = {
  peakScore: number
  peakPercentile: number
  targetGap: number | null
  averageScore: number | null
  goalScore: number | null
  variancePts: number | null
  varianceLow: number | null
  varianceHigh: number | null
  sectionDropoffPct: number | null
}

export type PrepTestInsightLogRow = {
  id: string
  prepTestId: string | null
  testLabel: string
  dateLabel: string
  takenAt: string
  bookmarked: boolean
  score: number | null
  rawScore: number
  rawMax: number
  momentum: number | null
  sections: PrepTestSectionAccuracy[]
  untimedDelta: number | null
}

const DEFAULT_GOAL_SCORE = 170
const ROLLING_WINDOW = 5

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function scoreForInsights(record: PrepTestRecord): number | null {
  if (record.hasScaledScore) return record.scaledScore
  return null
}

function sectionAccuracyPct(section: PrepTestSectionAccuracy): number | null {
  if (section.max <= 0) return null
  return (section.correct / section.max) * 100
}

/** Average of S4 accuracy minus mean(S1–S3) across attempts that have four sections. */
export function computeSectionDropoffPct(records: readonly PrepTestRecord[]): number | null {
  const deltas: number[] = []
  for (const record of records) {
    const sections = [...(record.sections ?? [])].sort((a, b) => a.number - b.number)
    if (sections.length < 4) continue
    const firstThree = sections.slice(0, 3)
    const fourth = sections[3]!
    const early = firstThree
      .map(sectionAccuracyPct)
      .filter((pct): pct is number => pct != null)
    const late = sectionAccuracyPct(fourth)
    if (early.length === 0 || late == null) continue
    const earlyAvg = early.reduce((sum, pct) => sum + pct, 0) / early.length
    deltas.push(late - earlyAvg)
  }
  if (deltas.length === 0) return null
  return round1(deltas.reduce((sum, d) => sum + d, 0) / deltas.length)
}

export function computePrepTestInsightStats(
  records: readonly PrepTestRecord[],
  goalScore: number | null = DEFAULT_GOAL_SCORE,
): PrepTestInsightStats | null {
  if (records.length === 0) return null

  const scaled = records
    .map((record) => ({ record, score: scoreForInsights(record) }))
    .filter((row): row is { record: PrepTestRecord; score: number } => row.score != null)
  if (scaled.length === 0) return null

  const peak = scaled.reduce((best, row) => (row.score > best.score ? row : best), scaled[0]!)
  const averageScore = round1(scaled.reduce((sum, row) => sum + row.score, 0) / scaled.length)
  const resolvedGoal = goalScore != null && Number.isFinite(goalScore) ? goalScore : DEFAULT_GOAL_SCORE
  const targetGap = round1(averageScore - resolvedGoal)

  const chronological = [...scaled].sort(
    (a, b) => Date.parse(a.record.takenAt) - Date.parse(b.record.takenAt),
  )
  const lastFive = chronological.slice(-ROLLING_WINDOW)
  const varianceScores = lastFive.map((row) => row.score)
  const varianceLow = varianceScores.length > 0 ? Math.min(...varianceScores) : null
  const varianceHigh = varianceScores.length > 0 ? Math.max(...varianceScores) : null
  const variancePts =
    varianceLow != null && varianceHigh != null ? Math.round(varianceHigh - varianceLow) : null

  return {
    peakScore: peak.score,
    peakPercentile: Math.round(peak.record.percentile),
    targetGap,
    averageScore,
    goalScore: resolvedGoal,
    variancePts,
    varianceLow,
    varianceHigh,
    sectionDropoffPct: computeSectionDropoffPct(records),
  }
}

/** Score minus the mean of up to the previous 5 chronological attempts. */
export function computePrepTestMomentum(
  record: PrepTestRecord,
  chronologicalRecords: readonly PrepTestRecord[],
): number | null {
  const score = scoreForInsights(record)
  if (score == null) return null
  const prior: number[] = []
  for (const row of chronologicalRecords) {
    if (row.id === record.id) break
    const priorScore = scoreForInsights(row)
    if (priorScore != null) prior.push(priorScore)
  }
  if (prior.length === 0) return null
  const window = prior.slice(-ROLLING_WINDOW)
  const avg = window.reduce((sum, value) => sum + value, 0) / window.length
  return round1(score - avg)
}

export function rollingAverageSeries(
  scores: readonly (number | null)[],
  window = ROLLING_WINDOW,
): Array<number | null> {
  return scores.map((_, index) => {
    const slice = scores.slice(Math.max(0, index - window + 1), index + 1).filter((v): v is number => v != null)
    if (slice.length === 0) return null
    return round1(slice.reduce((sum, value) => sum + value, 0) / slice.length)
  })
}

function formatInsightDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function buildPrepTestInsightLogRows(
  records: readonly PrepTestRecord[],
): PrepTestInsightLogRow[] {
  const chronological = [...records].sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt))
  return chronological
    .map((record) => {
      const score = scoreForInsights(record)
      const momentum = computePrepTestMomentum(record, chronological)
      const untimedDelta =
        record.hasScaledScore && Number.isFinite(record.blindReviewScaled)
          ? round1(record.blindReviewScaled - record.scaledScore)
          : null
      return {
        id: record.id,
        prepTestId: record.prepTestId ?? null,
        testLabel: `PT${record.prepTestNumber || "—"}`,
        dateLabel: formatInsightDate(record.takenAt),
        takenAt: record.takenAt,
        bookmarked: record.bookmarked,
        score,
        rawScore: record.rawScore,
        rawMax: record.rawMax,
        momentum,
        sections: [...(record.sections ?? [])].sort((a, b) => a.number - b.number),
        untimedDelta,
      } satisfies PrepTestInsightLogRow
    })
    .reverse()
}

export function sortInsightLogRows(
  rows: readonly PrepTestInsightLogRow[],
  mode: "recent" | "momentum",
): PrepTestInsightLogRow[] {
  const copy = [...rows]
  if (mode === "momentum") {
    return copy.sort((a, b) => {
      const am = a.momentum ?? Number.NEGATIVE_INFINITY
      const bm = b.momentum ?? Number.NEGATIVE_INFINITY
      if (bm !== am) return bm - am
      return Date.parse(b.takenAt) - Date.parse(a.takenAt)
    })
  }
  return copy.sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt))
}

export function sectionTone(section: PrepTestSectionAccuracy, siblings: readonly PrepTestSectionAccuracy[]): "strong" | "weak" {
  const pct = sectionAccuracyPct(section)
  if (pct == null) return "strong"
  const others = siblings
    .filter((row) => row.number !== section.number)
    .map(sectionAccuracyPct)
    .filter((value): value is number => value != null)
  if (others.length === 0) return "strong"
  const avg = others.reduce((sum, value) => sum + value, 0) / others.length
  return pct + 0.5 < avg ? "weak" : "strong"
}

export { DEFAULT_GOAL_SCORE, ROLLING_WINDOW }
