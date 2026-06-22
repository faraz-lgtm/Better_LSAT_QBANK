type DrillSessionMetadataLike = {
  source?: unknown
  difficulty?: unknown
}

const DASHBOARD_ADAPTIVE_DRILL_SOURCE = "dashboard_adaptive_drill"
const DASHBOARD_ADAPTIVE_DRILL_QUERY = "dashboardAdaptive"

type DashboardAdaptiveDrillContext = {
  metadata?: DrillSessionMetadataLike | null
  dashboardAdaptiveEntry?: boolean
}

function isPrepCourseDrillSession(metadata: DrillSessionMetadataLike | null | undefined): boolean {
  if (!metadata) return false
  return (
    metadata.source === "prep_course_active_drill" || metadata.source === "prep_course_adaptive_drill"
  )
}

function isDashboardAdaptiveDrillSession(metadata: DrillSessionMetadataLike | null | undefined): boolean {
  if (!metadata) return false
  return metadata.source === DASHBOARD_ADAPTIVE_DRILL_SOURCE
}

function isDashboardAdaptiveDrill(context: DashboardAdaptiveDrillContext): boolean {
  if (context.dashboardAdaptiveEntry) return true
  return isDashboardAdaptiveDrillSession(context.metadata)
}

function drillSessionSupportsBlindReview(context: DashboardAdaptiveDrillContext): boolean {
  if (isDashboardAdaptiveDrill(context)) return false
  return true
}

export {
  DASHBOARD_ADAPTIVE_DRILL_QUERY,
  DASHBOARD_ADAPTIVE_DRILL_SOURCE,
  drillSessionSupportsBlindReview,
  isDashboardAdaptiveDrill,
  isDashboardAdaptiveDrillSession,
  isPrepCourseDrillSession,
}
