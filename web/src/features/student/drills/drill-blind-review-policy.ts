type DrillSessionMetadataLike = {
  source?: unknown
  difficulty?: unknown
}

function isPrepCourseDrillSession(metadata: DrillSessionMetadataLike | null | undefined): boolean {
  if (!metadata) return false
  return (
    metadata.source === "prep_course_active_drill" || metadata.source === "prep_course_adaptive_drill"
  )
}

function isDashboardAdaptiveDrillSession(metadata: DrillSessionMetadataLike | null | undefined): boolean {
  if (!metadata) return false
  if (isPrepCourseDrillSession(metadata)) return false
  return metadata.difficulty === "adaptive"
}

function drillSessionSupportsBlindReview(metadata: DrillSessionMetadataLike | null | undefined): boolean {
  if (isDashboardAdaptiveDrillSession(metadata)) return false
  return true
}

export { drillSessionSupportsBlindReview, isDashboardAdaptiveDrillSession, isPrepCourseDrillSession }
