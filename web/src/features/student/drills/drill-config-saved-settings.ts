import {
  drillConfigOptions,
  type DrillDifficulty,
  type DrillSectionType,
  type DrillShowAnswers,
  type DrillStatus,
  type DrillTiming,
} from "@/features/student/drills/drill-types"
import { isValidDrillTiming } from "@/features/student/drills/drill-timing"

const STORAGE_PREFIX = "lsat.drill-config-settings"

export type SavedDrillConfig = {
  questionCount: string
  passageCount: string
  timing: DrillTiming
  showAnswers: DrillShowAnswers
  customize: boolean
  selection: string
  /** Selected question-type ids; empty means all skills. */
  tags: string[]
  difficulty: DrillDifficulty
  status: DrillStatus
  /** Pick-my-own question ids when selection is `manual`. */
  manualQuestionIds: string[]
  /** PrepTest ordinals for the saved manual picks (for titles). */
  manualPrepTestNumbers: number[]
}

export function drillConfigSettingsKey(sectionType: DrillSectionType): string {
  return `${STORAGE_PREFIX}.${sectionType}`
}

function optionValues(options: readonly { value: string }[]): Set<string> {
  return new Set(options.map((option) => option.value))
}

function normalizeTags(raw: unknown): string[] | null {
  if (Array.isArray(raw)) {
    const out: string[] = []
    const seen = new Set<string>()
    for (const item of raw) {
      if (typeof item !== "string") continue
      const trimmed = item.trim()
      if (!trimmed || trimmed === "any" || seen.has(trimmed)) continue
      seen.add(trimmed)
      out.push(trimmed)
    }
    return out
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (!trimmed || trimmed === "any") return []
    return [trimmed]
  }
  return null
}

function normalizeStringIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (typeof item !== "string") continue
    const trimmed = item.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

function normalizePrepTestNumbers(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  const out: number[] = []
  const seen = new Set<number>()
  for (const item of raw) {
    const n = typeof item === "number" ? item : Number.parseInt(String(item), 10)
    if (!Number.isFinite(n) || n <= 0) continue
    const rounded = Math.round(n)
    if (seen.has(rounded)) continue
    seen.add(rounded)
    out.push(rounded)
  }
  return out
}

function parseSavedDrillConfig(raw: unknown): SavedDrillConfig | null {
  if (!raw || typeof raw !== "object") return null
  const parsed = raw as Partial<SavedDrillConfig>
  const showAnswersValues = optionValues(drillConfigOptions.showAnswers)
  const difficultyValues = optionValues(drillConfigOptions.difficulty)
  const statusValues = optionValues(drillConfigOptions.status)
  const questionCountValues = optionValues(drillConfigOptions.questionCount)
  const passageCountValues = optionValues(drillConfigOptions.passageCount)
  const selectionValues = optionValues(drillConfigOptions.selection)

  if (typeof parsed.questionCount !== "string" || !questionCountValues.has(parsed.questionCount)) {
    return null
  }
  if (typeof parsed.passageCount !== "string" || !passageCountValues.has(parsed.passageCount)) {
    return null
  }
  if (typeof parsed.timing !== "string" || !isValidDrillTiming(parsed.timing)) return null
  const rawShowAnswers = (raw as { showAnswers?: unknown }).showAnswers
  const showAnswers = rawShowAnswers === "never" ? "end" : rawShowAnswers
  if (typeof showAnswers !== "string" || !showAnswersValues.has(showAnswers)) {
    return null
  }
  if (typeof parsed.customize !== "boolean") return null
  if (typeof parsed.selection !== "string" || !selectionValues.has(parsed.selection)) return null
  const tags = normalizeTags((raw as { tags?: unknown }).tags)
  if (tags == null) return null
  if (typeof parsed.difficulty !== "string" || !difficultyValues.has(parsed.difficulty)) return null
  if (typeof parsed.status !== "string" || !statusValues.has(parsed.status)) return null

  const manualQuestionIds = normalizeStringIdList((raw as { manualQuestionIds?: unknown }).manualQuestionIds)
  const manualPrepTestNumbers = normalizePrepTestNumbers(
    (raw as { manualPrepTestNumbers?: unknown }).manualPrepTestNumbers,
  )

  return {
    questionCount: parsed.questionCount,
    passageCount: parsed.passageCount,
    timing: parsed.timing,
    showAnswers: showAnswers as SavedDrillConfig["showAnswers"],
    customize: parsed.customize,
    selection: parsed.selection,
    tags,
    difficulty: parsed.difficulty,
    status: parsed.status,
    manualQuestionIds,
    manualPrepTestNumbers,
  }
}

export function readSavedDrillConfig(sectionType: DrillSectionType): SavedDrillConfig | null {
  try {
    const raw = window.localStorage.getItem(drillConfigSettingsKey(sectionType))
    if (!raw) return null
    return parseSavedDrillConfig(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function writeSavedDrillConfig(sectionType: DrillSectionType, config: SavedDrillConfig): void {
  window.localStorage.setItem(drillConfigSettingsKey(sectionType), JSON.stringify(config))
}

export function clearSavedDrillConfig(sectionType: DrillSectionType): void {
  window.localStorage.removeItem(drillConfigSettingsKey(sectionType))
}
