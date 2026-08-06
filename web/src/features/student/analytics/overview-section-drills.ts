/** Initial drills shown per LR/RC section on Insights Overview. */
const OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE = 5

function visibleOverviewSectionDrillCount(total: number, expanded: boolean): number {
  if (expanded || total <= OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE) return total
  return OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE
}

export { OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE, visibleOverviewSectionDrillCount }
