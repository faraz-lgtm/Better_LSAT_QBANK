import type { AnalyticsStat } from "@/features/student/lib/mock-analytics"
import type { TimeRangeValue } from "@/features/student/components/time-range-filter"
import {
  getPrepTestHistoryEntries,
  mockPrepTestRecords,
  type PrepTestHistoryEntry,
} from "@/features/student/lib/mock-analytics-preptests"

export type { PrepTestHistoryEntry }

/**
 * Catalog of LR / RC question-type drills. The `id` values match the row
 * ids on the analytics overview page so the Drill CTA can deep link into a
 * pre-filtered view via `/app/analytics/drills?type=<id>`.
 */
export type DrillType = {
  id: string
  label: string
  section: "LR" | "RC"
}

export const DRILL_TYPES: readonly DrillType[] = [
  { id: "lr-conditional", label: "Conditional reasoning", section: "LR" },
  { id: "lr-flaw", label: "Flaw or descriptive weakening", section: "LR" },
  { id: "lr-link", label: "Link assumption", section: "LR" },
  { id: "lr-phenomenon", label: "Phenomenon-hypothesis", section: "LR" },
  { id: "rc-critique", label: "Critique or debate", section: "RC" },
  { id: "rc-comparative", label: "Comparative", section: "RC" },
  { id: "rc-problem", label: "Problem-analysis", section: "RC" },
  { id: "rc-implied", label: "Implied", section: "RC" },
] as const

export function findDrillType(id: string | null | undefined): DrillType | null {
  if (!id) return null
  return DRILL_TYPES.find((type) => type.id === id) ?? null
}

export type DrillRecord = {
  id: string
  typeId: DrillType["id"]
  /** ISO date string when the drill was taken. */
  takenAt: string
  questionsTotal: number
  questionsCorrect: number
  durationSeconds: number
  /** Estimated PT-equivalent scaled score (120-180) for the drill. */
  ptEquivalentScore: number
}

/**
 * Twenty-four drills spread across ~6 months and balanced across drill
 * types. Accuracy improves over time so the chart shows an obvious upward
 * trend, mirroring the Figma reference.
 */
export const mockDrillRecords: DrillRecord[] = [
  { id: "d1", typeId: "lr-conditional", takenAt: "2025-11-08", questionsTotal: 10, questionsCorrect: 5, durationSeconds: 740, ptEquivalentScore: 146 },
  { id: "d2", typeId: "lr-flaw", takenAt: "2025-11-15", questionsTotal: 10, questionsCorrect: 4, durationSeconds: 720, ptEquivalentScore: 144 },
  { id: "d3", typeId: "rc-critique", takenAt: "2025-11-23", questionsTotal: 8, questionsCorrect: 4, durationSeconds: 880, ptEquivalentScore: 145 },
  { id: "d4", typeId: "lr-link", takenAt: "2025-12-02", questionsTotal: 10, questionsCorrect: 5, durationSeconds: 710, ptEquivalentScore: 148 },
  { id: "d5", typeId: "rc-comparative", takenAt: "2025-12-13", questionsTotal: 8, questionsCorrect: 5, durationSeconds: 820, ptEquivalentScore: 149 },
  { id: "d6", typeId: "lr-conditional", takenAt: "2025-12-21", questionsTotal: 10, questionsCorrect: 6, durationSeconds: 680, ptEquivalentScore: 150 },
  { id: "d7", typeId: "lr-phenomenon", takenAt: "2026-01-04", questionsTotal: 10, questionsCorrect: 5, durationSeconds: 750, ptEquivalentScore: 148 },
  { id: "d8", typeId: "rc-problem", takenAt: "2026-01-12", questionsTotal: 8, questionsCorrect: 5, durationSeconds: 800, ptEquivalentScore: 150 },
  { id: "d9", typeId: "lr-flaw", takenAt: "2026-01-20", questionsTotal: 10, questionsCorrect: 7, durationSeconds: 660, ptEquivalentScore: 153 },
  { id: "d10", typeId: "lr-link", takenAt: "2026-01-28", questionsTotal: 10, questionsCorrect: 6, durationSeconds: 690, ptEquivalentScore: 151 },
  { id: "d11", typeId: "rc-implied", takenAt: "2026-02-05", questionsTotal: 8, questionsCorrect: 4, durationSeconds: 850, ptEquivalentScore: 147 },
  { id: "d12", typeId: "lr-conditional", takenAt: "2026-02-14", questionsTotal: 10, questionsCorrect: 7, durationSeconds: 640, ptEquivalentScore: 155 },
  { id: "d13", typeId: "rc-critique", takenAt: "2026-02-22", questionsTotal: 8, questionsCorrect: 6, durationSeconds: 780, ptEquivalentScore: 154 },
  { id: "d14", typeId: "lr-flaw", takenAt: "2026-03-02", questionsTotal: 10, questionsCorrect: 7, durationSeconds: 620, ptEquivalentScore: 156 },
  { id: "d15", typeId: "lr-phenomenon", takenAt: "2026-03-09", questionsTotal: 10, questionsCorrect: 6, durationSeconds: 700, ptEquivalentScore: 152 },
  { id: "d16", typeId: "rc-comparative", takenAt: "2026-03-17", questionsTotal: 8, questionsCorrect: 6, durationSeconds: 760, ptEquivalentScore: 155 },
  { id: "d17", typeId: "lr-link", takenAt: "2026-03-25", questionsTotal: 10, questionsCorrect: 8, durationSeconds: 600, ptEquivalentScore: 159 },
  { id: "d18", typeId: "rc-problem", takenAt: "2026-04-03", questionsTotal: 8, questionsCorrect: 6, durationSeconds: 740, ptEquivalentScore: 156 },
  { id: "d19", typeId: "lr-conditional", takenAt: "2026-04-12", questionsTotal: 10, questionsCorrect: 8, durationSeconds: 590, ptEquivalentScore: 161 },
  { id: "d20", typeId: "rc-implied", takenAt: "2026-04-20", questionsTotal: 8, questionsCorrect: 6, durationSeconds: 720, ptEquivalentScore: 158 },
  { id: "d21", typeId: "lr-flaw", takenAt: "2026-04-27", questionsTotal: 10, questionsCorrect: 9, durationSeconds: 560, ptEquivalentScore: 164 },
  { id: "d22", typeId: "rc-critique", takenAt: "2026-05-02", questionsTotal: 8, questionsCorrect: 7, durationSeconds: 700, ptEquivalentScore: 162 },
  { id: "d23", typeId: "lr-link", takenAt: "2026-05-07", questionsTotal: 10, questionsCorrect: 9, durationSeconds: 540, ptEquivalentScore: 166 },
  { id: "d24", typeId: "lr-conditional", takenAt: "2026-05-10", questionsTotal: 10, questionsCorrect: 9, durationSeconds: 520, ptEquivalentScore: 168 },
]

const DAYS = 24 * 60 * 60 * 1000

function getCutoff(value: TimeRangeValue, reference: Date): Date | null {
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

export function filterDrillsByTimeRange(
  records: readonly DrillRecord[],
  value: TimeRangeValue,
): DrillRecord[] {
  if (records.length === 0) return []
  const sorted = [...records].sort(
    (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime(),
  )
  const newest = new Date(sorted[sorted.length - 1].takenAt)
  const cutoff = getCutoff(value, newest)
  if (!cutoff) return sorted
  const filtered = sorted.filter((record) => new Date(record.takenAt).getTime() >= cutoff.getTime())
  return filtered.length > 0 ? filtered : sorted.slice(-1)
}

export function filterDrillsByType(
  records: readonly DrillRecord[],
  typeId: string | null,
): DrillRecord[] {
  if (!typeId) return [...records]
  return records.filter((record) => record.typeId === typeId)
}

export type DrillProgressPoint = {
  id: string
  label: string
  takenAt: string
  scorePct: number
  ptEquivalent: number
}

export function getDrillProgressPoints(records: readonly DrillRecord[]): DrillProgressPoint[] {
  return [...records]
    .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
    .map((record, index) => ({
      id: record.id,
      label: `Drill ${index + 1}`,
      takenAt: record.takenAt,
      scorePct: Math.round((record.questionsCorrect / Math.max(1, record.questionsTotal)) * 100),
      ptEquivalent: record.ptEquivalentScore,
    }))
}

export type DrillStats = {
  drillsTaken: number
  questionsDrilled: number
  questionsCorrect: number
  accuracyPct: number
  averagePtEquivalent: number
}

export function computeDrillStats(records: readonly DrillRecord[]): DrillStats | null {
  if (records.length === 0) return null
  const drillsTaken = records.length
  const questionsDrilled = records.reduce((sum, r) => sum + r.questionsTotal, 0)
  const questionsCorrect = records.reduce((sum, r) => sum + r.questionsCorrect, 0)
  const accuracyPct = Math.round((questionsCorrect / Math.max(1, questionsDrilled)) * 100)
  const averagePtEquivalent = Math.round(
    records.reduce((sum, r) => sum + r.ptEquivalentScore, 0) / drillsTaken,
  )
  return { drillsTaken, questionsDrilled, questionsCorrect, accuracyPct, averagePtEquivalent }
}

export function buildDrillStatTiles(stats: DrillStats): AnalyticsStat[] {
  return [
    { id: "drills-taken", label: "DRILLS TAKEN", value: String(stats.drillsTaken), accent: "#0d47a1" },
    { id: "accuracy", label: "ACCURACY", value: `${stats.accuracyPct}%`, accent: "#5463a9" },
    { id: "questions-drilled", label: "QUESTIONS DRILLED", value: String(stats.questionsDrilled), accent: "#116b97" },
    { id: "answered-correctly", label: "ANSWERED CORRECTLY", value: String(stats.questionsCorrect), accent: "#0bbcc9" },
  ]
}

/**
 * Static stats kept for any caller still importing this directly. New code
 * should compose with `computeDrillStats` + `buildDrillStatTiles` so the
 * tiles react to the time range and type filters.
 */
export const mockAnalyticsDrillStats: AnalyticsStat[] = buildDrillStatTiles(
  computeDrillStats(mockDrillRecords) ?? {
    drillsTaken: 0,
    questionsDrilled: 0,
    questionsCorrect: 0,
    accuracyPct: 0,
    averagePtEquivalent: 0,
  },
)

export type DrillScoreProgressPoint = DrillProgressPoint & {
  /** Back-compat alias used by older imports referencing chart point shape. */
  test: string
}

export const mockDrillScoreProgress: DrillScoreProgressPoint[] = getDrillProgressPoints(
  mockDrillRecords,
).map((point) => ({ ...point, test: point.label }))

/**
 * PrepTest history shown on every analytics page. Derived from the
 * canonical PrepTest records so all three pages stay in sync.
 */
export const mockPrepTestHistory: PrepTestHistoryEntry[] = getPrepTestHistoryEntries(mockPrepTestRecords)
