import type { ReactNode } from "react"
import { List } from "lucide-react"

import { PracticeSectionIntroStaticTimer } from "@/features/student/practice-session/practice-section-intro-static-timer"
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
  timerProgress?: number
  closeButton: ReactNode
}

const toolGroupClass =
  "flex h-[52px] items-center rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] px-[13px]"
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
  timerProgress = 1,
  closeButton,
}: PracticeSectionIntroHeaderProps) {
  return (
    <header className="practice-session-header flex h-[80px] w-full shrink-0 items-center rounded-t-[16px] border-b border-[#dfe1e7] bg-[#eceff3] px-6 py-3">
      <div className="flex w-full min-w-0 items-center gap-6">
        <p
          className="flex h-[52px] min-w-0 flex-1 items-center truncate text-[20px] font-bold leading-[1.35] text-[#062357]"
          title={title}
        >
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-[24px]">
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
          <PracticeSectionIntroStaticTimer
            label={timerLabel}
            displaySeconds={timerDisplaySeconds}
            progress={timerProgress}
          />
          {closeButton}
        </div>
      </div>
    </header>
  )
}

export { PracticeSectionIntroHeader }
