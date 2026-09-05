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
  tags: string
  difficulty: DrillDifficulty
  status: DrillStatus
}

export function drillConfigSettingsKey(sectionType: DrillSectionType): string {
  return `${STORAGE_PREFIX}.${sectionType}`
}

function optionValues(options: readonly { value: string }[]): Set<string> {
  return new Set(options.map((option) => option.value))
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
  if (typeof parsed.tags !== "string") return null
  if (typeof parsed.difficulty !== "string" || !difficultyValues.has(parsed.difficulty)) return null
  if (typeof parsed.status !== "string" || !statusValues.has(parsed.status)) return null

  return {
    questionCount: parsed.questionCount,
    passageCount: parsed.passageCount,
    timing: parsed.timing,
    showAnswers: showAnswers as SavedDrillConfig["showAnswers"],
    customize: parsed.customize,
    selection: parsed.selection,
    tags: parsed.tags,
    difficulty: parsed.difficulty,
    status: parsed.status,
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
