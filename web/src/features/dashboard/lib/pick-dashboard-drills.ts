import type { ContinueDrill, SuggestedDrill } from "@/features/student/drills/drill-dashboard-mappers"

export type DashboardDrillFilter = "all" | "lr" | "rc"

export type DashboardActiveDrill = ContinueDrill | (SuggestedDrill & { isSuggested: true })

export function dashboardDrillMoreHref(section: "LR" | "RC"): string {
  return section === "LR" ? "/app/practice/drills/lr/new" : "/app/practice/drills/rc/new"
}

function pickSectionDrill(
  continueDrills: ContinueDrill[],
  suggestedDrills: SuggestedDrill[],
  section: "LR" | "RC",
): DashboardActiveDrill | null {
  const fromContinue = continueDrills.find((drill) => drill.section === section)
  if (fromContinue) return fromContinue
  const fromSuggested = suggestedDrills.find((drill) => drill.section === section)
  if (fromSuggested) return { ...fromSuggested, isSuggested: true as const }
  return null
}

/** Paid dashboard shows at most one LR and one RC drill (in-progress first, else suggested). */
export function pickDashboardActiveDrills(
  continueDrills: ContinueDrill[],
  suggestedDrills: SuggestedDrill[],
  filter: DashboardDrillFilter,
): DashboardActiveDrill[] {
  if (filter === "lr") {
    const drill = pickSectionDrill(continueDrills, suggestedDrills, "LR")
    return drill ? [drill] : []
  }
  if (filter === "rc") {
    const drill = pickSectionDrill(continueDrills, suggestedDrills, "RC")
    return drill ? [drill] : []
  }

  return [pickSectionDrill(continueDrills, suggestedDrills, "LR"), pickSectionDrill(continueDrills, suggestedDrills, "RC")].filter(
    (drill): drill is DashboardActiveDrill => drill != null,
  )
}
