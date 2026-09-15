/** Max named question types before the label falls back to Varied Mix. */
export const DRILL_TITLE_NAMED_TYPE_LIMIT = 3

export const VARIED_MIX_DRILL_TITLE = "Varied Mix"

/**
 * Build a drill display title from the question-type names the student selected.
 * 0 or >3 types → Varied Mix; 1–3 types → "Type1, Type2, Type3 Drill".
 */
export function formatDrillTitleFromTypeNames(typeNames: readonly string[]): string {
  const names = typeNames.map((name) => name.trim()).filter(Boolean)
  if (names.length === 0 || names.length > DRILL_TITLE_NAMED_TYPE_LIMIT) {
    return VARIED_MIX_DRILL_TITLE
  }
  return `${names.join(", ")} Drill`
}

/** Ensure a single-type / legacy label ends with " Drill" when it is not Varied Mix. */
export function ensureDrillTitleSuffix(label: string): string {
  const trimmed = label.trim()
  if (!trimmed) return VARIED_MIX_DRILL_TITLE
  if (trimmed.toLowerCase() === VARIED_MIX_DRILL_TITLE.toLowerCase()) {
    return VARIED_MIX_DRILL_TITLE
  }
  if (/\bdrill\b/i.test(trimmed)) return trimmed
  return `${trimmed} Drill`
}

export function isVariedMixTitle(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === VARIED_MIX_DRILL_TITLE.toLowerCase()
}

/** Collect type names from metadata fields used across start / analytics / legacy sessions. */
export function typeNamesFromDrillMetadata(metadata: Record<string, unknown>): string[] {
  const fromLabels = Array.isArray(metadata.tagLabels)
    ? metadata.tagLabels.filter((value): value is string => typeof value === "string")
    : []
  if (fromLabels.length > 0) {
    return fromLabels.map((name) => name.trim()).filter(Boolean)
  }

  for (const key of ["questionTypeName", "tagLabel"] as const) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim()) return [value.trim()]
  }
  return []
}
