/** Max weakest drills shown per LR/RC section on Insights Overview before See More. */
const OVERVIEW_SECTION_DRILLS_MAX = 3

/** Caps each section to the top N weakest topics already ordered by priority. */
function topOverviewSectionDrills<T>(rows: readonly T[], max = OVERVIEW_SECTION_DRILLS_MAX): T[] {
  return rows.slice(0, Math.max(0, max))
}

/** Mean accuracy across rows that already have an accuracy % (nulls ignored). */
function averageSectionAccuracyPct(
  rows: readonly { accuracyPct: number | null }[],
): number | null {
  const values = rows
    .map((r) => r.accuracyPct)
    .filter((n): n is number => n != null && Number.isFinite(n))
  if (values.length === 0) return null
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

/**
 * Figma overview weakness cards: signed distance to target from the student's accuracy.
 * API `gap` is goal − accuracy; UI shows accuracy − goal (e.g. "-36% to Target").
 */
function formatGapToTargetLabel(gapPct: number | null): string | null {
  if (gapPct == null || !Number.isFinite(gapPct)) return null
  const toTarget = Math.round((-gapPct) * 10) / 10
  const abs = Math.abs(toTarget)
  const formatted = Number.isInteger(abs) ? String(abs) : abs.toFixed(1)
  if (toTarget === 0) return "On target"
  return `${toTarget > 0 ? "+" : "-"}${formatted}% to Target`
}

export {
  OVERVIEW_SECTION_DRILLS_MAX,
  averageSectionAccuracyPct,
  formatGapToTargetLabel,
  topOverviewSectionDrills,
}
