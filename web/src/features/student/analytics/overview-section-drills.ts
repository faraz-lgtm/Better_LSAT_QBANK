/** Top weakest drills shown per LR/RC section on Insights Overview (collapsed). */
const OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE = 3

function visibleOverviewSectionDrillCount(total: number, expanded: boolean): number {
  if (expanded || total <= OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE) return total
  return OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE
}

export { OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE, visibleOverviewSectionDrillCount }
