export type AnalyticsSectionFilter = "all" | "LR" | "RC"

export function parseAnalyticsSectionParam(value: string | null): AnalyticsSectionFilter {
  if (!value) return "all"
  const normalized = value.trim().toUpperCase()
  if (normalized === "LR" || normalized === "RC") return normalized
  return "all"
}

export function analyticsSectionParamValue(filter: AnalyticsSectionFilter): string | null {
  return filter === "all" ? null : filter.toLowerCase()
}

export function matchesAnalyticsSectionFilter(
  sectionType: "LR" | "RC" | "LG" | null | undefined,
  filter: AnalyticsSectionFilter,
): boolean {
  if (filter === "all") return true
  return sectionType === filter
}
