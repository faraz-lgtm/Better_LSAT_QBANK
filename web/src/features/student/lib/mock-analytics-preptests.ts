import type { TimeRangeValue } from "@/features/student/components/time-range-filter"

/**
 * Shape consumed by the shared `AnalyticsPrepTestHistory` component. Owned
 * here so the analytics modules can layer on top of a single source of
 * truth without circular imports.
 */
export type PrepTestHistoryEntry = {
  id: string
  testLabel: string
  dateLabel: string
  bookmarked: boolean
  score: number
  scoreMax: number
  blindReviewScore: number
  blindReviewMax: number
}

/**
 * Canonical PrepTest record used as the single source of truth for the
 * analytics PrepTests page. All stat tiles, the score-progress chart, and
 * the PrepTest history list are derived from this dataset.
 */
export type PrepTestRecord = {
  id: string
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
  /** Scaled 120-180 LSAT score. */
  scaledScore: number
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
export const mockPrepTestRecords: PrepTestRecord[] = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
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
      rawScore: record.lrCorrect + record.rcCorrect,
      rawMax: record.lrMax + record.rcMax,
      scaledScore: record.scaledScore,
      takenAt: record.takenAt,
    }))
}

function formatHistoryDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
}

/**
 * Adapt the canonical PrepTest records to the shape used by the shared
 * `AnalyticsPrepTestHistory` component. Sorted newest-first so the most
 * recent test sits at the top of the list.
 */
export function getPrepTestHistoryEntries(
  records: readonly PrepTestRecord[],
): PrepTestHistoryEntry[] {
  return [...records]
    .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())
    .map((record) => ({
      id: record.id,
      testLabel: `PT${record.prepTestNumber}`,
      dateLabel: formatHistoryDate(record.takenAt),
      bookmarked: record.bookmarked,
      score: record.lrCorrect + record.rcCorrect,
      scoreMax: record.lrMax + record.rcMax,
      blindReviewScore: Math.round(((record.blindReviewScaled - 120) / 60) * (record.lrMax + record.rcMax)),
      blindReviewMax: record.lrMax + record.rcMax,
    }))
}

export type PrepTestStats = {
  bestScore: number
  bestPercentile: number
  averageScore: number
  averagePercentile: number
  averageLrMissed: number
  averageRcMissed: number
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
  const scaled = records.map((r) => r.scaledScore)
  const percentiles = records.map((r) => r.percentile)
  const lrMissed = records.map((r) => r.lrCorrect - r.lrMax)
  const rcMissed = records.map((r) => r.rcCorrect - r.rcMax)
  const brScaled = records.map((r) => r.blindReviewScaled)
  const brDiffs = records.map((r) => r.blindReviewScaled - r.scaledScore)

  const bestIndex = scaled.reduce(
    (best, current, index) => (current > scaled[best] ? index : best),
    0,
  )
  const bestBrIndex = brScaled.reduce(
    (best, current, index) => (current > brScaled[best] ? index : best),
    0,
  )

  const avg = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length

  return {
    bestScore: scaled[bestIndex],
    bestPercentile: percentiles[bestIndex],
    averageScore: round(avg(scaled)),
    averagePercentile: round(avg(percentiles)),
    averageLrMissed: signed(avg(lrMissed)),
    averageRcMissed: signed(avg(rcMissed)),
    bestBlindReview: brScaled[bestBrIndex],
    averageBlindReview: round(avg(brScaled)),
    averageBlindReviewDifference: signed(avg(brDiffs)),
    blindReviewDifferenceHigh: Math.max(...brDiffs),
    blindReviewDifferenceLow: Math.min(...brDiffs),
  }
}
