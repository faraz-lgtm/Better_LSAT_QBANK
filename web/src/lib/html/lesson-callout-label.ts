/** Default TipTap placeholder text — not real callout title content. */
export const LESSON_CALLOUT_LABEL_PLACEHOLDER = "Key term · stimulus"

/**
 * Normalize a callout `data-label` for display.
 * Missing, blank, and the editor placeholder all mean "no title".
 */
export function resolveLessonCalloutLabel(raw: string | null | undefined): string {
  const label = (raw ?? "").trim()
  if (!label || label === LESSON_CALLOUT_LABEL_PLACEHOLDER) return ""
  return label
}
