/** Prep Drills browse list (free-plan upgrade gates live in-page). */
export const PRACTICE_DRILLS_LIST_HREF = "/app/practice/drills"

function isPracticeDrillsListPath(pathname: string): boolean {
  return pathname === PRACTICE_DRILLS_LIST_HREF || pathname === `${PRACTICE_DRILLS_LIST_HREF}/`
}

export { isPracticeDrillsListPath }
