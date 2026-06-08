import type { ReactNode } from "react"
import { List } from "lucide-react"

import { PracticeSessionTimer } from "@/features/student/practice-session/practice-session-timer"
import type { PracticeToolMode } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type PracticeSectionIntroHeaderProps = {
  title: string
  fontScale: number
  toolMode: PracticeToolMode
  onFontSize: () => void
  onLineSpacing: () => void
  onUnderline: () => void
  timerLabel?: string
  timerDisplaySeconds: number
  timerPaused: boolean
  onToggleTimerPause: () => void
  timerProgress: number
  finishButton: ReactNode
}

const toolGroupClass =
  "flex h-[52px] items-center rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-3"
const toolTextBtnClass =
  "flex size-7 items-center justify-center rounded text-xs font-bold text-[#666d80] transition hover:bg-[#eceff3] hover:text-[#062357]"

function PracticeSectionIntroHeader({
  title,
  fontScale,
  toolMode,
  onFontSize,
  onLineSpacing,
  onUnderline,
  timerLabel,
  timerDisplaySeconds,
  timerPaused,
  onToggleTimerPause,
  timerProgress,
  finishButton,
}: PracticeSectionIntroHeaderProps) {
  return (
    <header className="practice-session-header flex shrink-0 items-center gap-3 border-b border-[#dfe1e7] bg-white px-5 py-4 md:gap-4 md:px-8">
      <p
        className="min-w-0 shrink-0 text-lg font-bold leading-tight text-[#062357] md:text-xl"
        title={title}
      >
        {title}
      </p>
      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 md:gap-3">
        <div className={cn(toolGroupClass, "gap-1")}>
          <button type="button" className={toolTextBtnClass} aria-label="Text size" onClick={onFontSize}>
            Aa
            <span className="sr-only"> ({fontScale}x)</span>
          </button>
          <button
            type="button"
            className={toolTextBtnClass}
            aria-label="Line spacing"
            onClick={onLineSpacing}
          >
            <List className="size-4" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className={cn(
              toolTextBtnClass,
              "underline",
              toolMode === "underline" && "bg-[#eceff3] text-[#062357]",
            )}
            aria-label="Underline"
            aria-pressed={toolMode === "underline"}
            onClick={onUnderline}
          >
            U
          </button>
        </div>
        <PracticeSessionTimer
          label={timerLabel}
          displaySeconds={timerDisplaySeconds}
          paused={timerPaused}
          onTogglePause={onToggleTimerPause}
          progress={timerProgress}
        />
        {finishButton}
      </div>
    </header>
  )
}

export { PracticeSectionIntroHeader }
