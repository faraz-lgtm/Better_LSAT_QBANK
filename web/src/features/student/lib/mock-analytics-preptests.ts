import type { TimeRangeValue } from "@/features/student/components/time-range-filter"
import { hasLawHubLrStats, hasLawHubRcStats } from "@/features/student/analytics/prep-test-lr-rc-scores"

/**
 * Shape consumed by the shared `AnalyticsPrepTestHistory` component. Owned
 * here so the analytics modules can layer on top of a single source of
 * truth without circular imports.
 */
export type PrepTestHistoryEntry = {
  id: string
  testLabel: string
  dateLabel: string
  /** ISO timestamp used for history sort. */
  takenAt?: string | null
  bookmarked: boolean
  score: number
  scoreMax: number
  blindReviewScore: number
  blindReviewMax: number
  /** Present for drill / section history rows when the pool is known. */
  sectionType?: "LR" | "RC" | "LG" | null
}

/**
 * Canonical PrepTest record used as the single source of truth for the
 * analytics PrepTests page. All stat tiles, the score-progress chart, and
 * the PrepTest history list are derived from this dataset.
 */
export type PrepTestRecord = {
  id: string
  /** admin_prep_tests.id when known; Insights history `id` is the practice session. */
  prepTestId?: string | null
  prepTestNumber: number
  /** ISO date string when the test was taken. */
  takenAt: string
  bookmarked: boolean
  /** LR section: raw correct out of lrMax. */
  lrCorrect: number
  lrMax: number
  /** RC section: raw correct out of rcMax. */
  rcCorrect: number
  rcMax: number
  /** Scaled 120-180 LSAT score when a conversion exists. */
  scaledScore: number
  /** False when the attempt has only a raw score (no 120–180 conversion). */
  hasScaledScore: boolean
  /** Raw correct answers across the scored test. */
  rawScore: number
  rawMax: number
  /** Percentile for the scaled score (0-100). */
  percentile: number
  /** Blind review scaled 120-180 score. */
  blindReviewScaled: number
  blindReviewPercentile: number
}

/**
 * Eight recent PrepTests spread across roughly the last six months so the
 * time-range filter produces visibly different results. Scores trend upward
 * and then plateau, which matches the chart shape in the Figma design.
 */
function withPrepTestScoreFields(
  record: Omit<PrepTestRecord, "rawScore" | "rawMax" | "hasScaledScore">,
): PrepTestRecord {
  return {
    ...record,
    rawScore: record.lrCorrect + record.rcCorrect,
    rawMax: Math.max(1, record.lrMax + record.rcMax),
    hasScaledScore: record.scaledScore >= 120 && record.scaledScore <= 180,
  }
}

export const mockPrepTestRecords: PrepTestRecord[] = [
  withPrepTestScoreFields({
    id: "pt145",
    prepTestNumber: 145,
    takenAt: "2025-10-03",
    bookmarked: false,
    lrCorrect: 20,
    lrMax: 26,
    rcCorrect: 22,
    rcMax: 27,
    scaledScore: 167,
    percentile: 90.6,
    blindReviewScaled: 167,
    blindReviewPercentile: 91,
  }),
  withPrepTestScoreFields({
    id: "pt150",
    prepTestNumber: 150,
    takenAt: "2025-11-04",
    bookmarked: false,
    lrCorrect: 15,
    lrMax: 26,
    rcCorrect: 14,
    rcMax: 27,
    scaledScore: 148,
    percentile: 38,
    blindReviewScaled: 154,
    blindReviewPercentile: 56,
  }),
  withPrepTestScoreFields({
    id: "pt151",
    prepTestNumber: 151,
    takenAt: "2025-12-09",
    bookmarked: false,
    lrCorrect: 16,
    lrMax: 26,
    rcCorrect: 15,
    rcMax: 27,
    scaledScore: 151,
    percentile: 47,
    blindReviewScaled: 156,
    blindReviewPercentile: 64,
  }),
  withPrepTestScoreFields({
    id: "pt152",
    prepTestNumber: 152,
    takenAt: "2026-01-13",
    bookmarked: true,
    lrCorrect: 15,
    lrMax: 26,
    rcCorrect: 14,
    rcMax: 27,
    scaledScore: 150,
    percentile: 44,
    blindReviewScaled: 155,
    blindReviewPercentile: 60,
  }),
  withPrepTestScoreFields({
    id: "pt153",
    prepTestNumber: 153,
    takenAt: "2026-02-10",
    bookmarked: false,
    lrCorrect: 17,
    lrMax: 26,
    rcCorrect: 15,
    rcMax: 27,
    scaledScore: 153,
    percentile: 53,
    blindReviewScaled: 158,
    blindReviewPercentile: 71,
  }),
  withPrepTestScoreFields({
    id: "pt154",
    prepTestNumber: 154,
    takenAt: "2026-03-03",
    bookmarked: false,
    lrCorrect: 17,
    lrMax: 26,
    rcCorrect: 14,
    rcMax: 27,
    scaledScore: 152,
    percentile: 50,
    blindReviewScaled: 157,
    blindReviewPercentile: 67,
  }),
  withPrepTestScoreFields({
    id: "pt155",
    prepTestNumber: 155,
    takenAt: "2026-03-24",
    bookmarked: true,
    lrCorrect: 19,
    lrMax: 26,
    rcCorrect: 16,
    rcMax: 27,
    scaledScore: 159,
    percentile: 73,
    blindReviewScaled: 163,
    blindReviewPercentile: 84,
  }),
  withPrepTestScoreFields({
    id: "pt156",
    prepTestNumber: 156,
    takenAt: "2026-04-14",
    bookmarked: false,
    lrCorrect: 20,
    lrMax: 26,
    rcCorrect: 17,
    rcMax: 27,
    scaledScore: 162,
    percentile: 81,
    blindReviewScaled: 166,
    blindReviewPercentile: 90,
  }),
  withPrepTestScoreFields({
    id: "pt157",
    prepTestNumber: 157,
    takenAt: "2026-05-04",
    bookmarked: true,
    lrCorrect: 22,
    lrMax: 26,
    rcCorrect: 19,
    rcMax: 27,
    scaledScore: 169,
    percentile: 94,
    blindReviewScaled: 173,
    blindReviewPercentile: 98,
  }),
]

const DAYS = 24 * 60 * 60 * 1000

function getTimeRangeCutoff(value: TimeRangeValue, reference: Date): Date | null {
  switch (value) {
    case "7d":
      return new Date(reference.getTime() - 7 * DAYS)
    case "30d":
      return new Date(reference.getTime() - 30 * DAYS)
    case "90d":
      return new Date(reference.getTime() - 90 * DAYS)
    case "ytd":
      return new Date(reference.getFullYear(), 0, 1)
    case "all":
    default:
      return null
  }
}

/**
 * Filter PrepTest records by an actual date window relative to the most
 * recent record. Falls back to keeping the latest record when a strict
 * cutoff would otherwise yield an empty set so the chart never shows
 * nothing.
 */
export function filterPrepTestsByTimeRange(
  records: readonly PrepTestRecord[],
  value: TimeRangeValue,
): PrepTestRecord[] {
  if (records.length === 0) return []
  const sorted = [...records].sort(
    (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime(),
  )
  const newest = new Date(sorted[sorted.length - 1].takenAt)
  const cutoff = getTimeRangeCutoff(value, newest)
  if (!cutoff) return sorted
  const filtered = sorted.filter((record) => new Date(record.takenAt).getTime() >= cutoff.getTime())
  return filtered.length > 0 ? filtered : sorted.slice(-1)
}

export type PrepTestProgressPoint = {
  id: string
  test: string
  rawScore: number
  rawMax: number
  scaledScore: number
  hasScaledScore: boolean
  takenAt: string
}

export function getPrepTestProgressPoints(
  records: readonly PrepTestRecord[],
): PrepTestProgressPoint[] {
  return [...records]
    .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
    .map((record) => ({
      id: record.id,
      test: `PT ${record.prepTestNumber}`,
      rawScore: record.rawScore,
      rawMax: record.rawMax,
      scaledScore: record.scaledScore,
      hasScaledScore: record.hasScaledScore,
      takenAt: record.takenAt,
    }))
}

export function selectPrepTestChartPoints(
  points: readonly PrepTestProgressPoint[],
  tab: "scaled" | "raw",
): PrepTestProgressPoint[] {
  if (tab === "scaled") return points.filter((point) => point.hasScaledScore)
  return [...points]
}

export function formatPrepTestChartValue(
  point: PrepTestProgressPoint,
  tab: "scaled" | "raw",
): string {
  const raw = `Raw ${point.rawScore}/${point.rawMax}`
  if (tab === "raw") {
    return point.hasScaledScore ? `${raw} · Scaled ${point.scaledScore}` : raw
  }
  return point.hasScaledScore ? `Scaled ${point.scaledScore} · ${raw}` : raw
}

export function prepTestChartTooltipLines(
  point: PrepTestProgressPoint,
  tab: "scaled" | "raw",
): string[] {
  const raw = `Raw ${point.rawScore}/${point.rawMax}`
  const scaled = `Scaled ${point.scaledScore}`
  if (tab === "raw") {
    return point.hasScaledScore ? [raw, scaled] : [raw]
  }
  return point.hasScaledScore ? [scaled, raw] : [raw]
}

function formatHistoryDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
}

export type PrepTestHistorySort = "date-desc" | "date-asc" | "score-desc" | "score-asc"

function takenAtMs(iso: string): number {
  const time = new Date(iso).getTime()
  return Number.isFinite(time) ? time : 0
}

function displayedHistoryScore(record: PrepTestRecord): number {
  return record.rawScore
}

export function sortPrepTestRecords(
  records: readonly PrepTestRecord[],
  sort: PrepTestHistorySort,
): PrepTestRecord[] {
  const out = [...records]
  switch (sort) {
    case "date-desc":
      out.sort((a, b) => takenAtMs(b.takenAt) - takenAtMs(a.takenAt) || b.id.localeCompare(a.id))
      break
    case "date-asc":
      out.sort((a, b) => takenAtMs(a.takenAt) - takenAtMs(b.takenAt) || a.id.localeCompare(b.id))
      break
    case "score-desc":
      out.sort(
        (a, b) =>
          displayedHistoryScore(b) - displayedHistoryScore(a) || b.scaledScore - a.scaledScore,
      )
      break
    case "score-asc":
      out.sort(
        (a, b) =>
          displayedHistoryScore(a) - displayedHistoryScore(b) || a.scaledScore - b.scaledScore,
      )
      break
  }
  return out
}

/**
 * Adapt PrepTest records to the shared history-row shape. Caller controls order.
 */
export function getPrepTestHistoryEntries(
  records: readonly PrepTestRecord[],
): PrepTestHistoryEntry[] {
  return records.map((record) => ({
    id: record.id,
    testLabel: `PT${record.prepTestNumber}`,
    dateLabel: formatHistoryDate(record.takenAt),
    takenAt: record.takenAt,
    bookmarked: Boolean(record.bookmarked),
    score: record.rawScore,
    scoreMax: record.rawMax,
    blindReviewScore: Math.round(
      ((record.blindReviewScaled - 120) / 60) * (record.lrMax + record.rcMax),
    ),
    blindReviewMax: record.lrMax + record.rcMax,
  }))
}

export type PrepTestStats = {
  bestScore: number
  bestPercentile: number
  bestRawScore: number
  bestRawMax: number
  averageScore: number
  averagePercentile: number
  averageRawScore: number
  /** Signed missed count (e.g. -5). Null when no LawHub-valid LR section stats exist. */
  averageLrMissed: number | null
  averageRcMissed: number | null
  bestBlindReview: number
  averageBlindReview: number
  averageBlindReviewDifference: number
  blindReviewDifferenceHigh: number
  blindReviewDifferenceLow: number
}

function round(value: number): number {
  return Math.round(value)
}

function signed(value: number): number {
  return Math.round(value)
}

export function computePrepTestStats(records: readonly PrepTestRecord[]): PrepTestStats | null {
  if (records.length === 0) return null
  const scaledRecords = records.filter((r) => r.hasScaledScore)
  const scaled = scaledRecords.map((r) => r.scaledScore)
  const percentiles = scaledRecords.map((r) => r.percentile)
  const rawScores = records.map((r) => r.rawScore)
  const lrMissed = records
    .filter((r) => hasLawHubLrStats(r.lrMax) && r.lrCorrect >= 0 && r.lrCorrect <= r.lrMax)
    .map((r) => Math.max(-r.lrMax, Math.min(0, r.lrCorrect - r.lrMax)))
  const rcMissed = records
    .filter((r) => hasLawHubRcStats(r.rcMax) && r.rcCorrect >= 0 && r.rcCorrect <= r.rcMax)
    .map((r) => Math.max(-r.rcMax, Math.min(0, r.rcCorrect - r.rcMax)))
  const brScaled = records.map((r) => r.blindReviewScaled)
  const brDiffs = scaledRecords.map((r) => r.blindReviewScaled - r.scaledScore)

  const bestIndex = scaled.length
    ? scaled.reduce((best, current, index) => (current > scaled[best]! ? index : best), 0)
    : 0
  const bestRawIndex = rawScores.reduce(
    (best, current, index) => (current > rawScores[best]! ? index : best),
    0,
  )
  const bestBrIndex = brScaled.reduce(
    (best, current, index) => (current > brScaled[best]! ? index : best),
    0,
  )

  const avg = (values: number[]) => (values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length)
  const bestScaledRecord = scaledRecords[bestIndex]
  const bestRawRecord = records[bestRawIndex]

  return {
    bestScore: scaled[bestIndex] ?? 0,
    bestPercentile: percentiles[bestIndex] ?? 0,
    bestRawScore: bestScaledRecord?.rawScore ?? bestRawRecord?.rawScore ?? 0,
    bestRawMax: bestScaledRecord?.rawMax ?? bestRawRecord?.rawMax ?? 1,
    averageScore: scaled.length > 0 ? round(avg(scaled)) : 0,
    averagePercentile: percentiles.length > 0 ? round(avg(percentiles)) : 0,
    averageRawScore: round(avg(rawScores)),
    averageLrMissed: lrMissed.length > 0 ? signed(avg(lrMissed)) : null,
    averageRcMissed: rcMissed.length > 0 ? signed(avg(rcMissed)) : null,
    bestBlindReview: brScaled[bestBrIndex] ?? 0,
    averageBlindReview: round(avg(brScaled)),
    averageBlindReviewDifference: brDiffs.length > 0 ? signed(avg(brDiffs)) : 0,
    blindReviewDifferenceHigh: brDiffs.length > 0 ? Math.max(...brDiffs) : 0,
    blindReviewDifferenceLow: brDiffs.length > 0 ? Math.min(...brDiffs) : 0,
  }
}
