/** Prep Sections browse list (free-plan upgrade gates live in-page). */
const PRACTICE_SECTIONS_LIST_HREF = "/app/practice/sections"

function isPracticeSectionsListPath(pathname: string): boolean {
  return pathname === PRACTICE_SECTIONS_LIST_HREF || pathname === `${PRACTICE_SECTIONS_LIST_HREF}/`
}

export { PRACTICE_SECTIONS_LIST_HREF, isPracticeSectionsListPath }
