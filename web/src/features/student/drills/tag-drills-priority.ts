import type { PriorityRow, PriorityTier } from "@/lib/api/analytics"

const PRIORITY_RANK: Record<PriorityTier | "high" | "medium" | "low", number> = {
  highest: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/** Initial visible tag drills — one strong row of priorities without overwhelming the page. */
const TAG_DRILLS_INITIAL_VISIBLE = 8

/** Cap for the collapsed list (must stay in the 5–10 range). */
const TAG_DRILLS_VISIBLE_MAX = 10

function resolveTier(row: PriorityRow): PriorityTier | "low" {
  if (row.priorityTier) return row.priorityTier
  return row.priorityLevel ?? "low"
}

function comparePriorityRows(a: PriorityRow, b: PriorityRow): number {
  const rankDiff = PRIORITY_RANK[resolveTier(a)] - PRIORITY_RANK[resolveTier(b)]
  if (rankDiff !== 0) return rankDiff
  const scoreA = a.priorityScore ?? Number.NEGATIVE_INFINITY
  const scoreB = b.priorityScore ?? Number.NEGATIVE_INFINITY
  if (scoreB !== scoreA) return scoreB - scoreA
  const gapA = a.gap ?? Number.NEGATIVE_INFINITY
  const gapB = b.gap ?? Number.NEGATIVE_INFINITY
  if (gapB !== gapA) return gapB - gapA
  const accA = a.accuracyPct ?? Number.POSITIVE_INFINITY
  const accB = b.accuracyPct ?? Number.POSITIVE_INFINITY
  if (accA !== accB) return accA - accB
  return b.attemptCount - a.attemptCount
}

/**
 * Orders priority tags so the student's biggest weaknesses come first
 * (high priority / largest goal gap), then returns the collapsed window size.
 */
function orderPriorityRowsByWeakness(rows: PriorityRow[]): PriorityRow[] {
  return [...rows].sort(comparePriorityRows)
}

function visibleTagDrillCount(total: number, expanded: boolean): number {
  if (expanded || total <= TAG_DRILLS_INITIAL_VISIBLE) return total
  return Math.min(TAG_DRILLS_INITIAL_VISIBLE, TAG_DRILLS_VISIBLE_MAX)
}

export {
  TAG_DRILLS_INITIAL_VISIBLE,
  TAG_DRILLS_VISIBLE_MAX,
  comparePriorityRows,
  orderPriorityRowsByWeakness,
  visibleTagDrillCount,
}
