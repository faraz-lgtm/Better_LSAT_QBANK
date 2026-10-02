/** Max named question types before the label falls back to Varied Mix. */
export const DRILL_TITLE_NAMED_TYPE_LIMIT = 3

export const VARIED_MIX_DRILL_TITLE = "Varied Mix"

/** Fallback when Pick my own has no PrepTest numbers available. */
export const PICK_MY_OWN_DRILL_TITLE = "Pick My Own"

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

/** "157, 158 and 159" — matches the Pick-my-own session heading style. */
export function formatPrepTestNumberList(prepTestNumbers: readonly number[]): string {
  const pts = [
    ...new Set(
      prepTestNumbers.filter((n) => typeof n === "number" && Number.isFinite(n) && n > 0).map((n) => Math.round(n)),
    ),
  ].sort((a, b) => a - b)
  if (pts.length === 0) return ""
  if (pts.length === 1) return String(pts[0])
  if (pts.length === 2) return `${pts[0]} and ${pts[1]}`
  return `${pts.slice(0, -1).join(", ")} and ${pts[pts.length - 1]}`
}

/**
 * Pick-my-own session heading, e.g. "5 Questions from PT 157, 158 and 159".
 */
export function formatPickMyOwnDrillTitle(input: {
  questionCount: number
  prepTestNumbers: readonly number[]
}): string {
  const count = Math.max(0, Math.floor(input.questionCount))
  const qWord = count === 1 ? "Question" : "Questions"
  const ptList = formatPrepTestNumberList(input.prepTestNumbers)
  if (!ptList) {
    return count > 0 ? `${count} ${qWord}` : PICK_MY_OWN_DRILL_TITLE
  }
  return `${count} ${qWord} from PT ${ptList}`
}

function isPlaceholderManualTitle(value: string): boolean {
  const lower = value.trim().toLowerCase()
  return (
    lower === VARIED_MIX_DRILL_TITLE.toLowerCase() ||
    lower === PICK_MY_OWN_DRILL_TITLE.toLowerCase()
  )
}

/**
 * Prefer a typed title when available; manual picks use the stored Pick-my-own
 * heading (e.g. "5 Questions from PT …") rather than Varied Mix.
 */
export function resolveDrillDisplayTitle(input: {
  title?: string | null
  selection?: string | null
  tagLabels?: readonly string[] | null
}): string {
  const fromTags = Array.isArray(input.tagLabels)
    ? formatDrillTitleFromTypeNames(input.tagLabels)
    : null
  if (fromTags && !isVariedMixTitle(fromTags)) return fromTags

  const raw = typeof input.title === "string" ? input.title.trim() : ""
  if (raw && !isPlaceholderManualTitle(raw)) return raw

  if (input.selection === "manual") {
    return raw && !isVariedMixTitle(raw) ? raw : PICK_MY_OWN_DRILL_TITLE
  }
  return raw || VARIED_MIX_DRILL_TITLE
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
