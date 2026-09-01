import { resolveAccommodatedSectionMinutes } from "@/features/student/accommodations/accommodations-context"

function formatDrillTimingTitleLabel(timing: string, scaleFactor = 1): string {
  if (timing === "unlimited") return "Unlimited Time"
  if (timing === "per-q") return "Per question"
  if (timing === "35" || timing === "standard" || timing === "strict") {
    const mins = resolveAccommodatedSectionMinutes(scaleFactor)
    return `${mins} minutes`
  }
  return timing
}

function formatLrDrillResultsTitle(input: {
  questionCount: number
  timing: string
  take?: number | null
  scaleFactor?: number
}): string {
  const take = input.take != null && input.take > 0 ? input.take : 1
  return `${input.questionCount} Questions ${formatDrillTimingTitleLabel(input.timing, input.scaleFactor ?? 1)} - ${take}`
}

function formatRcDrillResultsTitle(input: {
  passageCount: number
  timing: string
  take?: number | null
  scaleFactor?: number
}): string {
  const take = input.take != null && input.take > 0 ? input.take : 1
  const count = Math.max(0, input.passageCount)
  return `${count} Passages ${formatDrillTimingTitleLabel(input.timing, input.scaleFactor ?? 1)} - ${take}`
}

function formatSectionResultsTitle(input: {
  prepTestNumber?: string | null
  prepTestTitle?: string | null
  sectionNumber?: number | null
}): string {
  const fromNumber = input.prepTestNumber?.replace(/^PT\s*/i, "").trim()
  const fromTitle = input.prepTestTitle?.match(/\d+/)?.[0]
  const pt = fromNumber || fromTitle || "—"
  const section = input.sectionNumber != null ? String(input.sectionNumber) : "—"
  return `PT${pt}.S${section}`
}

function formatTotalQuestionsLabel(total: number): string {
  return `Total Questions: ${String(total).padStart(2, "0")}`
}

function formatAccuracyPct(correct: number, total: number): string {
  if (total <= 0) return "0%"
  return `${Math.round((correct / total) * 100)}%`
}

function formatCorrectSummaryLine(correct: number, total: number): string {
  const missed = Math.max(0, total - correct)
  return `${correct}/${total} CORRECT (${missed > 0 ? `-${missed}` : "0"})`
}

function formatPaddedMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function formatMinutesSecondsLabel(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m} min ${s} sec`
}

function formatDrillAboutTiming(timing: string, elapsedSeconds: number, scaleFactor = 1): string {
  if (timing === "unlimited") return "Unlimited"
  if (timing === "35" || timing === "standard" || timing === "strict") {
    return `${resolveAccommodatedSectionMinutes(scaleFactor)} min`
  }
  if (timing === "per-q") return `Per question · ${formatMinutesSecondsLabel(elapsedSeconds)}`
  return timing
}

function formatLrDrillQuestionTitle(input: {
  prepTestNumber?: string | null
  prepTestTitle?: string | null
  sectionNumber?: number | null
  questionNumber?: number | null
}): string {
  const pt = input.prepTestNumber?.trim() || input.prepTestTitle || "—"
  const section = input.sectionNumber != null ? `S${input.sectionNumber}` : "S—"
  const q = input.questionNumber != null ? `Q${input.questionNumber}` : "Q—"
  return `PT ${pt}  .  ${section}  .  ${q}`
}

function formatTakeLabel(take: number): string {
  if (take <= 1) return "First"
  if (take === 2) return "Second"
  if (take === 3) return "Third"
  return String(take)
}

export {
  formatAccuracyPct,
  formatCorrectSummaryLine,
  formatDrillAboutTiming,
  formatLrDrillQuestionTitle,
  formatLrDrillResultsTitle,
  formatRcDrillResultsTitle,
  formatSectionResultsTitle,
  formatMinutesSecondsLabel,
  formatPaddedMmSs,
  formatTakeLabel,
  formatTotalQuestionsLabel,
}
