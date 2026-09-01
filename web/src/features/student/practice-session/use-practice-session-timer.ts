import { useCallback, useEffect, useState } from "react"

export const PRACTICE_SESSION_35_MIN_SECONDS = 35 * 60
export const PRACTICE_PER_QUESTION_SECONDS = 80

export function formatPracticeElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function isUnlimitedPracticeTiming(timing?: string | null): boolean {
  return !timing || timing === "unlimited"
}

export function isSectionCountdownTiming(timing?: string | null): boolean {
  return timing === "35" || timing === "standard" || timing === "strict"
}

export function isDrillCountdownTiming(timing?: string | null): boolean {
  return timing === "35" || timing === "per-q"
}

export function resolveTimerBudgetSeconds(options: {
  timing?: string | null
  questionCount?: number
  sectionTimerSeconds?: number
  /** Accommodation scale factor (e.g. 1.5 for time-and-a-half). Defaults to 1.0. */
  scaleFactor?: number
}): number {
  if (options.sectionTimerSeconds != null && options.sectionTimerSeconds > 0) {
    // sectionTimerSeconds is already scaled by the caller
    return options.sectionTimerSeconds
  }

  const scale = options.scaleFactor ?? 1.0
  const timing = options.timing ?? "unlimited"
  if (timing === "35" || timing === "standard" || timing === "strict") {
    return Math.round(PRACTICE_SESSION_35_MIN_SECONDS * scale)
  }
  if (timing === "per-q") {
    const count = Math.max(1, options.questionCount ?? 1)
    return Math.round(count * PRACTICE_PER_QUESTION_SECONDS * scale)
  }

  return 0
}

export function computeElapsedTimerProgress(elapsedSeconds: number, budgetSeconds: number): number {
  if (budgetSeconds <= 0) return 0
  return Math.min(1, Math.max(0, elapsedSeconds / budgetSeconds))
}

export function computeRemainingTimerProgress(remainingSeconds: number, budgetSeconds: number): number {
  if (budgetSeconds <= 0) return 0
  return Math.min(1, Math.max(0, remainingSeconds / budgetSeconds))
}

type UsePracticeSessionTimerOptions = {
  initialCountdown?: number | null
  enabled?: boolean
}

export function usePracticeSessionTimer(options?: UsePracticeSessionTimerOptions) {
  const enabled = options?.enabled !== false
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(options?.initialCountdown ?? null)

  const setInitialCountdown = useCallback((value: number | null) => {
    setCountdown(value)
  }, [])

  useEffect(() => {
    if (!enabled || paused) return
    const id = window.setInterval(() => {
      setElapsed((t) => t + 1)
      setCountdown((t) => (t != null && t > 0 ? t - 1 : t))
    }, 1000)
    return () => window.clearInterval(id)
  }, [enabled, paused])

  const resetElapsed = useCallback(() => {
    setElapsed(0)
  }, [])

  const pauseTimer = useCallback(() => {
    setPaused(true)
  }, [])

  const resumeTimer = useCallback(() => {
    setPaused(false)
  }, [])

  return {
    elapsed,
    countdown,
    paused,
    togglePause: () => setPaused((p) => !p),
    pauseTimer,
    resumeTimer,
    resetElapsed,
    setPaused,
    setInitialCountdown,
  }
}
