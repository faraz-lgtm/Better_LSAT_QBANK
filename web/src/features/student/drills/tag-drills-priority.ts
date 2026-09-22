import type { PriorityRow, PriorityTier } from "@/lib/api/analytics"

const PRIORITY_RANK: Record<PriorityTier | "high" | "medium" | "low", number> = {
  highest: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/** Initial visible drills in collapsed lists (continue + by-types). */
const TAG_DRILLS_INITIAL_VISIBLE = 5

/** Cap for the collapsed list (kept equal to the initial window). */
const TAG_DRILLS_VISIBLE_MAX = 5

/** A couple of top-priority types per section in the collapsed drills page lists. */
const TAG_DRILLS_PER_SECTION_INITIAL = 3

/** Max LR/RC by-type drills shown after “See more”. */
const TAG_DRILLS_PER_SECTION_EXPANDED = 10

/** In-progress drills previewed under each LR/RC continue section. */
const CONTINUE_DRILLS_PER_SECTION_INITIAL = 3

const PRIORITY_METER: Record<
  PriorityTier | "high" | "medium" | "low",
  { label: string; filledBars: number; color: string }
> = {
  highest: { label: "Highest", filledBars: 5, color: "#df1c41" },
  high: { label: "High", filledBars: 4, color: "#df1c41" },
  medium: { label: "Medium", filledBars: 3, color: "#ff6f00" },
  low: { label: "Low", filledBars: 2, color: "#ffbd4c" },
}

function resolveTier(row: Pick<PriorityRow, "priorityTier" | "priorityLevel">): PriorityTier | "low" {
  if (row.priorityTier) return row.priorityTier
  return row.priorityLevel ?? "low"
}

/** Meter for how high-priority a tag is for this student (not how hard the type is). */
function priorityMeterFromRow(row: Pick<PriorityRow, "priorityTier" | "priorityLevel">) {
  return PRIORITY_METER[resolveTier(row)]
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

function groupPriorityRowsBySection(rows: PriorityRow[]): { lr: PriorityRow[]; rc: PriorityRow[] } {
  const ordered = orderPriorityRowsByWeakness(rows)
  return {
    lr: ordered.filter((row) => row.sectionType === "LR"),
    rc: ordered.filter((row) => row.sectionType === "RC"),
  }
}

function visibleTagDrillCount(
  total: number,
  expanded: boolean,
  initial: number = TAG_DRILLS_INITIAL_VISIBLE,
  expandedMax: number = Number.POSITIVE_INFINITY,
): number {
  if (!expanded) {
    return total <= initial ? total : initial
  }
  return Math.min(total, expandedMax)
}

export {
  TAG_DRILLS_INITIAL_VISIBLE,
  TAG_DRILLS_PER_SECTION_INITIAL,
  TAG_DRILLS_PER_SECTION_EXPANDED,
  CONTINUE_DRILLS_PER_SECTION_INITIAL,
  TAG_DRILLS_VISIBLE_MAX,
  comparePriorityRows,
  groupPriorityRowsBySection,
  orderPriorityRowsByWeakness,
  priorityMeterFromRow,
  visibleTagDrillCount,
}
