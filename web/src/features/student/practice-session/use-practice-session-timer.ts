import { useCallback, useEffect, useState } from "react"

export const PRACTICE_SESSION_35_MIN_SECONDS = 35 * 60
export const PRACTICE_PER_QUESTION_SECONDS = 80

export function formatPracticeElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function resolveTimerBudgetSeconds(options: {
  timing?: string | null
  questionCount?: number
  sectionTimerSeconds?: number
}): number {
  if (options.sectionTimerSeconds != null && options.sectionTimerSeconds > 0) {
    return options.sectionTimerSeconds
  }

  const timing = options.timing ?? "unlimited"
  if (timing === "35") return PRACTICE_SESSION_35_MIN_SECONDS
  if (timing === "per-q") {
    const count = Math.max(1, options.questionCount ?? 1)
    return count * PRACTICE_PER_QUESTION_SECONDS
  }

  return PRACTICE_SESSION_35_MIN_SECONDS
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

  return {
    elapsed,
    countdown,
    paused,
    togglePause: () => setPaused((p) => !p),
    resetElapsed,
    setPaused,
    setInitialCountdown,
  }
}
