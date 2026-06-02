import { useCallback, useEffect, useState } from "react"

export function formatPracticeElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

type UsePracticeSessionTimerOptions = {
  initialCountdown?: number | null
}

export function usePracticeSessionTimer(options?: UsePracticeSessionTimerOptions) {
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(options?.initialCountdown ?? null)

  const setInitialCountdown = useCallback((value: number | null) => {
    setCountdown(value)
  }, [])

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setElapsed((t) => t + 1)
      setCountdown((t) => (t != null && t > 0 ? t - 1 : t))
    }, 1000)
    return () => window.clearInterval(id)
  }, [paused])

  return {
    elapsed,
    countdown,
    paused,
    togglePause: () => setPaused((p) => !p),
    setPaused,
    setInitialCountdown,
  }
}
