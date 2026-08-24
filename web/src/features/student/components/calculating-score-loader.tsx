import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

const CALCULATING_SCORE_BUFFER_MS = 2400
/** Keep results screens feeling deliberate; skip the wait in unit tests. */
const CALCULATING_SCORE_MIN_MS = import.meta.env.MODE === "test" ? 0 : CALCULATING_SCORE_BUFFER_MS

const STATUS_LINES = [
  "Scoring your answers…",
  "Comparing to LSAC scale…",
  "Preparing your insights…",
] as const

type UseCalculatingScoreRevealInput = {
  dataReady: boolean
  resetKey: string
  minMs?: number
}

/**
 * Holds the calculating UI until data is ready and a short premium buffer has elapsed.
 * Errors should bypass this gate and render immediately.
 */
function useCalculatingScoreReveal({
  dataReady,
  resetKey,
  minMs = CALCULATING_SCORE_MIN_MS,
}: UseCalculatingScoreRevealInput): boolean {
  const [minElapsed, setMinElapsed] = useState(minMs <= 0)

  useEffect(() => {
    if (minMs <= 0) {
      setMinElapsed(true)
      return
    }
    setMinElapsed(false)
    const timer = window.setTimeout(() => setMinElapsed(true), minMs)
    return () => window.clearTimeout(timer)
  }, [minMs, resetKey])

  return dataReady && minElapsed
}

type CalculatingScoreLoaderProps = {
  className?: string
  title?: string
  /** 0–100 visual progress; when omitted, animates on a loop. */
  progress?: number
}

function CalculatingScoreLoader({
  className,
  title = "Calculating your score",
  progress,
}: CalculatingScoreLoaderProps) {
  const [statusIndex, setStatusIndex] = useState(0)
  const [autoProgress, setAutoProgress] = useState(8)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStatusIndex((current) => (current + 1) % STATUS_LINES.length)
    }, 900)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (progress != null) return
    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const elapsed = now - started
      // Ease toward ~92% over the buffer window so it never looks stuck at 100% early.
      const next = Math.min(92, 8 + (elapsed / CALCULATING_SCORE_BUFFER_MS) * 84)
      setAutoProgress(next)
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [progress])

  const value = Math.round(progress ?? autoProgress)
  const ringStyle = {
    background: `conic-gradient(#0d47a1 ${value * 3.6}deg, #dfe1e7 0deg)`,
  }

  return (
    <div
      className={cn(
        "flex min-h-[min(420px,70vh)] w-full flex-col items-center justify-center gap-8 px-6",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex size-[120px] items-center justify-center">
        <div
          className="absolute inset-0 rounded-full shadow-[0_12px_32px_rgba(13,71,161,0.12)] transition-[background] duration-300"
          style={ringStyle}
          aria-hidden
        />
        <div className="absolute inset-[10px] rounded-full bg-white" aria-hidden />
        <div className="relative flex flex-col items-center">
          <span className="text-[28px] font-extrabold leading-none tracking-tight text-[#062357]">
            {value}%
          </span>
        </div>
      </div>

      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        <h2 className="!m-0 text-[22px] font-bold leading-[1.3] text-[#062357]">{title}</h2>
        <p className="min-h-5 text-sm font-medium tracking-[0.02em] text-[#666d80]">
          {STATUS_LINES[statusIndex]}
        </p>
      </div>

      <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-[#edf3ff]">
        <div
          className="h-full rounded-full bg-[#0d47a1] transition-[width] duration-300 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>

      <span className="sr-only">
        {title}. {STATUS_LINES[statusIndex]}
      </span>
    </div>
  )
}

export {
  CALCULATING_SCORE_MIN_MS,
  CalculatingScoreLoader,
  useCalculatingScoreReveal,
}
