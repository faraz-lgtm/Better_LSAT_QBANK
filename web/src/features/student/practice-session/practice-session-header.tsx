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
  boldEnabled: boolean
  italicEnabled: boolean
  onSelectColor: (color: HighlightColor) => void
  onEraser: () => void
  onUnderline: () => void
  onFontSize: () => void
  onToggleBold: () => void
  onToggleItalic: () => void
  timerLabel?: string
  timerDisplaySeconds: number
  timerPaused: boolean
  onToggleTimerPause: () => void
  onResetTimer?: () => void
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
  boldEnabled,
  italicEnabled,
  onSelectColor,
  onEraser,
  onUnderline,
  onFontSize,
  onToggleBold,
  onToggleItalic,
  timerLabel,
  timerDisplaySeconds,
  timerPaused,
  onToggleTimerPause,
  onResetTimer,
  timerProgress,
  timerDisplayClassName,
  finishButton,
}: PracticeSessionHeaderProps) {
  return (
    <header className="practice-session-header flex shrink-0 items-center gap-3 border-b border-[#dfe1e7] bg-[#eceff3] px-4 py-3 md:gap-4 md:px-6">
      <p
        className="min-w-0 flex-1 truncate text-lg font-bold leading-tight text-[#062357] md:text-xl"
        title={title}
      >
        {title}
      </p>
      <div className="relative shrink-0">
       
        <Input
          placeholder="Find Text"
          value={findQuery}
          onChange={(e) => onFindQueryChange(e.target.value)}
          className="h-[52px] w-[160px] rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] pl-10 pr-4 text-sm shadow-[0px_1px_1px_rgba(13,13,18,0.06)] placeholder:text-[#818898] xl:w-[200px]"
        />
      </div>
      <div className="practice-session-header-actions flex shrink-0 items-center gap-2 md:gap-3">
        <PracticeSessionToolbar
          activeColor={activeColor}
          toolMode={toolMode}
          fontScale={fontScale}
          boldEnabled={boldEnabled}
          italicEnabled={italicEnabled}
          onSelectColor={onSelectColor}
          onEraser={onEraser}
          onUnderline={onUnderline}
          onFontSize={onFontSize}
          onToggleBold={onToggleBold}
          onToggleItalic={onToggleItalic}
        />
        <PracticeSessionTimer
          label={timerLabel}
          displaySeconds={timerDisplaySeconds}
          paused={timerPaused}
          onTogglePause={onToggleTimerPause}
          onReset={onResetTimer}
          progress={timerProgress}
          displayClassName={timerDisplayClassName}
        />
        {finishButton}
      </div>
    </header>
  )
}

export { PracticeSessionHeader }
