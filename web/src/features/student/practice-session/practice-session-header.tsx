import type { ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { PracticeSessionTimer } from "@/features/student/practice-session/practice-session-timer"
import { PracticeSessionToolbar } from "@/features/student/practice-session/practice-session-toolbar"
import type { HighlightColor, PracticeToolMode } from "@/features/student/practice-session/practice-session-types"

type PracticeSessionHeaderProps = {
  title: string
  findQuery: string
  onFindQueryChange: (value: string) => void
  activeColor: HighlightColor | null
  toolMode: PracticeToolMode
  fontScale: number
  lineSpacing: number
  onSelectColor: (color: HighlightColor) => void
  onEraser: () => void
  onUnderline: () => void
  onFontSize: () => void
  onLineSpacing: () => void
  timerLabel?: string
  timerDisplaySeconds: number
  timerPaused: boolean
  onToggleTimerPause: () => void
  timerProgress: number
  timerDisplayClassName?: string
  finishButton: ReactNode
}

function PracticeSessionHeader({
  title,
  findQuery,
  onFindQueryChange,
  activeColor,
  toolMode,
  fontScale,
  lineSpacing,
  onSelectColor,
  onEraser,
  onUnderline,
  onFontSize,
  onLineSpacing,
  timerLabel,
  timerDisplaySeconds,
  timerPaused,
  onToggleTimerPause,
  timerProgress,
  timerDisplayClassName,
  finishButton,
}: PracticeSessionHeaderProps) {
  return (
    <header
      className="flex flex-col gap-3 border-b px-6 py-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-6"
      style={{ borderColor: "#dfe1e7", backgroundColor: "#eceff3" }}
    >
      <p className="shrink-0 text-2xl font-bold leading-tight text-[#062357]">{title}</p>
      <Input
        placeholder="Find Text"
        value={findQuery}
        onChange={(e) => onFindQueryChange(e.target.value)}
        className="h-[52px] w-full max-w-[200px] shrink-0 rounded-2xl border bg-[#f6f8fa] text-sm shadow-[0px_1px_1px_rgba(13,13,18,0.06)] placeholder:text-[#818898]"
        style={{ borderColor: "#dfe1e7" }}
      />
      <div className="flex flex-1 flex-wrap items-center justify-end gap-4 lg:ml-auto">
        <PracticeSessionToolbar
          activeColor={activeColor}
          toolMode={toolMode}
          fontScale={fontScale}
          lineSpacing={lineSpacing}
          onSelectColor={onSelectColor}
          onEraser={onEraser}
          onUnderline={onUnderline}
          onFontSize={onFontSize}
          onLineSpacing={onLineSpacing}
        />
        <PracticeSessionTimer
          label={timerLabel}
          displaySeconds={timerDisplaySeconds}
          paused={timerPaused}
          onTogglePause={onToggleTimerPause}
          progress={timerProgress}
          displayClassName={timerDisplayClassName}
        />
        {finishButton}
      </div>
    </header>
  )
}

export { PracticeSessionHeader }
