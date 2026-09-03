/** LSAT pace: 35 minutes / 25 questions = 1:24 per question. */
export const DRILL_STANDARD_SECONDS_PER_QUESTION = 84

/** 7Sage Target for 5 questions is 07:22 (442s); ratio vs Standard 07:00. */
const DRILL_TARGET_TO_STANDARD = 442 / 420

export const DRILL_SPEED_PERCENTS = [97, 94, 70] as const

export const DRILL_CUSTOM_PERCENT_MIN = 50
export const DRILL_CUSTOM_PERCENT_MAX = 200
export const DRILL_CUSTOM_TIME_STEP_SECONDS = 15
export const DRILL_CUSTOM_TIME_MIN_SECONDS = 15
export const DRILL_CUSTOM_TIME_MAX_SECONDS = 3 * 60 * 60

export function formatDrillMmSs(totalSeconds: number): string {
  const sec = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function formatDrillMmSsShort(totalSeconds: number): string {
  const sec = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function standardDrillSeconds(questionCount: number, scaleFactor = 1): number {
  const n = Math.max(1, questionCount)
  return Math.round(n * DRILL_STANDARD_SECONDS_PER_QUESTION * scaleFactor)
}

export function targetDrillSeconds(questionCount: number, scaleFactor = 1): number {
  return Math.round(standardDrillSeconds(questionCount, scaleFactor) * DRILL_TARGET_TO_STANDARD)
}

export function speedDrillSeconds(questionCount: number, percent: number, scaleFactor = 1): number {
  return Math.round((standardDrillSeconds(questionCount, scaleFactor) * percent) / 100)
}

export function isValidDrillTiming(value: string): boolean {
  if (value === "unlimited" || value === "35" || value === "per-q" || value === "pace" || value === "target") {
    return true
  }
  if (/^speed:(97|94|70)$/.test(value)) return true
  const pct = /^pct:(\d+)$/.exec(value)
  if (pct) {
    const n = Number(pct[1])
    return n >= DRILL_CUSTOM_PERCENT_MIN && n <= DRILL_CUSTOM_PERCENT_MAX
  }
  const time = /^time:(\d+)$/.exec(value)
  if (time) {
    const n = Number(time[1])
    return n >= DRILL_CUSTOM_TIME_MIN_SECONDS && n <= DRILL_CUSTOM_TIME_MAX_SECONDS
  }
  return false
}

export function parseSpeedPercent(timing: string): number | null {
  const match = /^speed:(\d+)$/.exec(timing)
  return match ? Number(match[1]) : null
}

export function parseCustomPercent(timing: string): number | null {
  const match = /^pct:(\d+)$/.exec(timing)
  return match ? Number(match[1]) : null
}

export function parseCustomTimeSeconds(timing: string): number | null {
  const match = /^time:(\d+)$/.exec(timing)
  return match ? Number(match[1]) : null
}

export function isPerQuestionDrillTiming(timing?: string | null): boolean {
  return timing === "per-q"
}

/** Session countdown budget. Per-question mode is one question's allotment (timer resets each item). */
export function resolveDrillTimingSeconds(
  timing: string,
  questionCount: number,
  scaleFactor = 1,
  perQuestionSeconds = 80,
): number {
  if (!timing || timing === "unlimited") return 0
  const n = Math.max(1, questionCount)
  const standard = standardDrillSeconds(n, scaleFactor)
  if (timing === "pace") return standard
  if (timing === "target") return targetDrillSeconds(n, scaleFactor)
  if (timing === "35") return Math.round(35 * 60 * scaleFactor)
  if (timing === "per-q") return Math.round(perQuestionSeconds * scaleFactor)
  const speed = parseSpeedPercent(timing)
  if (speed != null) return speedDrillSeconds(n, speed, scaleFactor)
  const pct = parseCustomPercent(timing)
  if (pct != null) return Math.round((standard * pct) / 100)
  const time = parseCustomTimeSeconds(timing)
  if (time != null) return time
  return 0
}

export function drillTimingTitleLabel(timing: string, scaleFactor = 1): string {
  if (timing === "unlimited") return "Unlimited Time"
  if (timing === "standard" || timing === "strict") {
    return `${Math.max(1, Math.round(35 * scaleFactor))} minutes`
  }
  return drillTimingTriggerLabel(timing, 1, scaleFactor)
}

/** Whole-drill estimate in minutes. Per-question mode uses n × 80s (not the reset-each-item countdown). */
export function estimatedDrillBudgetMinutes(
  timing: string,
  questionCount: number,
  scaleFactor = 1,
): number {
  if (!timing || timing === "unlimited") return 0
  if (timing === "per-q") {
    const n = Math.max(0, questionCount)
    return Math.max(1, Math.round((n * 80 * scaleFactor) / 60))
  }
  const seconds = resolveDrillTimingSeconds(timing, Math.max(1, questionCount), scaleFactor)
  if (seconds <= 0) return 0
  return Math.max(1, Math.round(seconds / 60))
}

export function drillTimingTriggerLabel(
  timing: string,
  _questionCount: number,
  scaleFactor = 1,
  perQuestionSeconds = 80,
): string {
  if (timing === "unlimited") return "Unlimited"
  if (timing === "pace") return "Standard"
  if (timing === "target") return "Target"
  if (timing === "35") {
    const mins = Math.max(1, Math.round(35 * scaleFactor))
    return `${mins} minutes`
  }
  if (timing === "per-q") {
    return `Per question (${formatDrillMmSsShort(Math.round(perQuestionSeconds * scaleFactor))})`
  }
  const speed = parseSpeedPercent(timing)
  if (speed != null) return `${speed}%`
  const pct = parseCustomPercent(timing)
  if (pct != null) return `${pct}%`
  const time = parseCustomTimeSeconds(timing)
  if (time != null) return formatDrillMmSs(time)
  return "Timing"
}

export function customPercentFromTiming(timing: string, questionCount: number, scaleFactor = 1): number {
  const pct = parseCustomPercent(timing)
  if (pct != null) return pct
  const speed = parseSpeedPercent(timing)
  if (speed != null) return speed
  if (timing === "pace") return 100
  if (timing === "target") {
    const standard = standardDrillSeconds(questionCount, scaleFactor)
    if (standard <= 0) return 100
    return Math.round((targetDrillSeconds(questionCount, scaleFactor) * 100) / standard)
  }
  const time = parseCustomTimeSeconds(timing)
  if (time != null) {
    const standard = standardDrillSeconds(questionCount, scaleFactor)
    if (standard <= 0) return 100
    return Math.max(
      DRILL_CUSTOM_PERCENT_MIN,
      Math.min(DRILL_CUSTOM_PERCENT_MAX, Math.round((time * 100) / standard)),
    )
  }
  return 100
}

export function customTimeFromTiming(timing: string, questionCount: number, scaleFactor = 1): number {
  const time = parseCustomTimeSeconds(timing)
  if (time != null) return time
  const seconds = resolveDrillTimingSeconds(timing === "unlimited" ? "pace" : timing, questionCount, scaleFactor)
  return Math.max(DRILL_CUSTOM_TIME_MIN_SECONDS, seconds || standardDrillSeconds(questionCount, scaleFactor))
}
