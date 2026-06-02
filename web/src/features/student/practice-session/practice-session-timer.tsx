import { Clock, Pause, Play } from "lucide-react"

import { formatPracticeElapsed } from "@/features/student/practice-session/use-practice-session-timer"
import { cn } from "@/lib/utils"

type PracticeSessionTimerProps = {
  label?: string
  displaySeconds: number
  paused: boolean
  onTogglePause: () => void
  progress: number
  displayClassName?: string
}

function PracticeSessionTimer({
  label = "Elapsed",
  displaySeconds,
  paused,
  onTogglePause,
  progress,
  displayClassName,
}: PracticeSessionTimerProps) {
  const pct = Math.min(100, Math.max(0, progress * 100))

  return (
    <div
      className="flex h-[52px] shrink-0 items-center rounded-2xl border bg-[#f6f8fa] px-3"
      style={{ borderColor: "#dfe1e7" }}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <Clock className="size-4 shrink-0 text-[#666d80]" strokeWidth={2} aria-hidden />
          <span className="text-sm font-medium text-[#666d80]">{label}</span>
          <span
            className={cn(
              "min-w-[46px] text-right text-sm font-semibold tabular-nums text-[#062357]",
              displayClassName,
            )}
          >
            {formatPracticeElapsed(displaySeconds)}
          </span>
          <button
            type="button"
            className="rounded-lg p-1 text-[#666d80] transition hover:bg-[#eceff3] hover:text-[#062357]"
            aria-label={paused ? "Resume timer" : "Pause timer"}
            onClick={onTogglePause}
          >
            {paused ? (
              <Play className="size-4" strokeWidth={2} />
            ) : (
              <Pause className="size-4" strokeWidth={2} />
            )}
          </button>
        </div>
        <div className="h-1.5 w-[179px] overflow-hidden rounded-lg bg-[#dfe1e7]">
          <div
            className="h-full rounded-lg bg-[#0d47a1] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export { PracticeSessionTimer }
