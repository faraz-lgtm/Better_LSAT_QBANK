/** Max weakest drills shown per LR/RC section on Insights Overview (no expand). */
const OVERVIEW_SECTION_DRILLS_MAX = 3

/** Caps each section to the top N weakest topics already ordered by priority. */
function topOverviewSectionDrills<T>(rows: readonly T[], max = OVERVIEW_SECTION_DRILLS_MAX): T[] {
  return rows.slice(0, Math.max(0, max))
}

export { OVERVIEW_SECTION_DRILLS_MAX, topOverviewSectionDrills }
