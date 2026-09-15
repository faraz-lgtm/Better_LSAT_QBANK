/** Max named question types before the label falls back to Varied Mix. */
export const DRILL_TITLE_NAMED_TYPE_LIMIT = 3

export const VARIED_MIX_DRILL_TITLE = 'Varied Mix'

/**
 * Build a drill display title from the question-type names the student selected.
 * 0 or >3 types → Varied Mix; 1–3 types → "Type1, Type2, Type3 Drill".
 */
export function formatDrillTitleFromTypeNames(typeNames: readonly string[]): string {
  const names = typeNames.map((name) => name.trim()).filter(Boolean)
  if (names.length === 0 || names.length > DRILL_TITLE_NAMED_TYPE_LIMIT) {
    return VARIED_MIX_DRILL_TITLE
  }
  return `${names.join(', ')} Drill`
}
