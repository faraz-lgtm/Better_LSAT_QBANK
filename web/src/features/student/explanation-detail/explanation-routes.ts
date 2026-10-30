/** Academy Explanations list (LawHub PrepTest explanations). */
export const EXPLANATIONS_LIST_HREF = "/app/learn/explanations"

function isExplanationsListPath(pathname: string): boolean {
  return pathname === EXPLANATIONS_LIST_HREF || pathname === `${EXPLANATIONS_LIST_HREF}/`
}

function isExplanationsPath(pathname: string): boolean {
  return pathname === EXPLANATIONS_LIST_HREF || pathname.startsWith(`${EXPLANATIONS_LIST_HREF}/`)
}

export { isExplanationsListPath, isExplanationsPath }
