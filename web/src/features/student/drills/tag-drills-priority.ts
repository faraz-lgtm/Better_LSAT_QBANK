import type { PriorityRow } from "@/lib/api/analytics"

const PRIORITY_RANK: Record<PriorityRow["priorityLevel"], number> = {
  high: 0,
  medium: 1,
  low: 2,
}

/** Initial visible tag drills — one strong row of priorities without overwhelming the page. */
const TAG_DRILLS_INITIAL_VISIBLE = 8

/** Cap for the collapsed list (must stay in the 5–10 range). */
const TAG_DRILLS_VISIBLE_MAX = 10

function comparePriorityRows(a: PriorityRow, b: PriorityRow): number {
  const rankDiff = PRIORITY_RANK[a.priorityLevel] - PRIORITY_RANK[b.priorityLevel]
  if (rankDiff !== 0) return rankDiff
  const gapA = a.gap ?? Number.NEGATIVE_INFINITY
  const gapB = b.gap ?? Number.NEGATIVE_INFINITY
  if (gapB !== gapA) return gapB - gapA
  if (a.accuracyPct !== b.accuracyPct) return a.accuracyPct - b.accuracyPct
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
