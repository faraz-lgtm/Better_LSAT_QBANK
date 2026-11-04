/** Insights Overview browse (free-plan upgrade gates live in-page). */
export const ANALYTICS_OVERVIEW_HREF = "/app/analytics"
export const ANALYTICS_DRILLS_HREF = "/app/analytics/drills"
export const ANALYTICS_SECTIONS_HREF = "/app/analytics/sections"
export const ANALYTICS_PREPTESTS_HREF = "/app/analytics/preptests"

const INSIGHTS_BROWSE_HREFS = [
  ANALYTICS_OVERVIEW_HREF,
  ANALYTICS_DRILLS_HREF,
  ANALYTICS_SECTIONS_HREF,
  ANALYTICS_PREPTESTS_HREF,
] as const

/** Top-level Insights pages free users may open; nested results stay soft-gated. */
function isInsightsBrowsePath(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/"
  return (INSIGHTS_BROWSE_HREFS as readonly string[]).includes(path)
}

export { isInsightsBrowsePath, INSIGHTS_BROWSE_HREFS }
