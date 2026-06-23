import type { ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { ACTIVE_DRILL_FIND_TEXT_INPUT_CLASS } from "@/features/student/practice-session/practice-session-active-drill-styles"
import { PracticeSessionTimer } from "@/features/student/practice-session/practice-session-timer"
import { PracticeSessionToolbar } from "@/features/student/practice-session/practice-session-toolbar"
import type { HighlightColor, PracticeSessionVariant, PracticeToolMode } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type PracticeSessionHeaderProps = {
  variant?: PracticeSessionVariant
  title: string
  findQuery: string
  onFindQueryChange: (value: string) => void
  activeColor: HighlightColor | null
  toolMode: PracticeToolMode
  fontScale: number
  lineSpacing?: number
  boldEnabled: boolean
  italicEnabled: boolean
  onSelectColor: (color: HighlightColor) => void
  onEraser: () => void
  onUnderline: () => void
  onFontSize: () => void
  onLineSpacing?: () => void
  onToggleBold: () => void
  onToggleItalic: () => void
  timerLabel?: string
  timerDisplaySeconds: number
  timerPaused: boolean
  onToggleTimerPause: () => void
  onResetTimer?: () => void
  timerProgress: number
  timerDisplayClassName?: string
  showTimer?: boolean
  titleClassName?: string
  finishButton: ReactNode
}

function PracticeSessionHeader({
  variant = "default",
  title,
  findQuery,
  onFindQueryChange,
  activeColor,
  toolMode,
  fontScale,
  lineSpacing,
  boldEnabled,
  italicEnabled,
  onSelectColor,
  onEraser,
  onUnderline,
  onFontSize,
  onLineSpacing,
  onToggleBold,
  onToggleItalic,
  timerLabel,
  timerDisplaySeconds,
  timerPaused,
  onToggleTimerPause,
  onResetTimer,
  timerProgress,
  timerDisplayClassName,
  showTimer = true,
  titleClassName,
  finishButton,
}: PracticeSessionHeaderProps) {
  const isActiveDrill = variant === "active-drill"

  if (isActiveDrill) {
    return (
      <header className="practice-session-header flex h-20 shrink-0 items-center overflow-visible rounded-t-[16px] border-b border-[#dfe1e7] bg-[#f6f8fa] px-6 py-3">
        <div className="flex w-full min-w-0 items-center gap-6">
          <p
            className={cn(
              "min-w-0 flex-1 truncate font-bold leading-[1.3] text-[#062357]",
              titleClassName ?? "text-2xl",
            )}
            title={title}
          >
            {title}
          </p>
          <div className="relative hidden shrink-0 md:block">
            <Input
              placeholder="Find Text"
              value={findQuery}
              onChange={(e) => onFindQueryChange(e.target.value)}
              className={ACTIVE_DRILL_FIND_TEXT_INPUT_CLASS}
            />
          </div>
          <PracticeSessionToolbar
            variant={variant}
            activeColor={activeColor}
            toolMode={toolMode}
            fontScale={fontScale}
            lineSpacing={lineSpacing}
            boldEnabled={boldEnabled}
            italicEnabled={italicEnabled}
            onSelectColor={onSelectColor}
            onEraser={onEraser}
            onUnderline={onUnderline}
            onFontSize={onFontSize}
            onLineSpacing={onLineSpacing}
            onToggleBold={onToggleBold}
            onToggleItalic={onToggleItalic}
          />
          {showTimer ? (
            <PracticeSessionTimer
              label={timerLabel}
              displaySeconds={timerDisplaySeconds}
              paused={timerPaused}
              onTogglePause={onToggleTimerPause}
              onReset={onResetTimer}
              progress={timerProgress}
              displayClassName={timerDisplayClassName}
            />
          ) : null}
          {finishButton}
        </div>
      </header>
    )
  }

  return (
    <header
      className={cn(
        "practice-session-header flex shrink-0 items-center gap-3 border-b border-[#dfe1e7] px-6 py-3 md:gap-4",
        "min-h-[80px] bg-[#eceff3]",
      )}
    >
      <p
        className={cn(
          "min-w-0 flex-1 truncate font-bold text-[#062357]",
          isActiveDrill ? "text-[24px] leading-[1.3]" : "text-lg leading-tight md:text-xl",
        )}
        title={title}
      >
        {title}
      </p>
      <div className="relative shrink-0">
        <Input
          placeholder="Find Text"
          value={findQuery}
          onChange={(e) => onFindQueryChange(e.target.value)}
          className={cn(
            "h-[52px] rounded-2xl border border-[#dfe1e7] pl-4 pr-4 text-sm shadow-[0px_1px_1px_rgba(13,13,18,0.06)] placeholder:text-[#818898]",
            isActiveDrill ? "w-[200px] bg-[#f6f8fa]" : "w-[160px] bg-[#f6f8fa] pl-10 xl:w-[200px]",
          )}
        />
      </div>
      <div className="practice-session-header-actions flex shrink-0 items-center gap-2 md:gap-3">
        <PracticeSessionToolbar
          variant={variant}
          activeColor={activeColor}
          toolMode={toolMode}
          fontScale={fontScale}
          lineSpacing={lineSpacing}
          boldEnabled={boldEnabled}
          italicEnabled={italicEnabled}
          onSelectColor={onSelectColor}
          onEraser={onEraser}
          onUnderline={onUnderline}
          onFontSize={onFontSize}
          onLineSpacing={onLineSpacing}
          onToggleBold={onToggleBold}
          onToggleItalic={onToggleItalic}
        />
        {showTimer ? (
          <PracticeSessionTimer
            label={timerLabel}
            displaySeconds={timerDisplaySeconds}
            paused={timerPaused}
            onTogglePause={onToggleTimerPause}
            onReset={onResetTimer}
            progress={timerProgress}
            displayClassName={timerDisplayClassName}
          />
        ) : null}
        {finishButton}
      </div>
    </header>
  )
}

export { PracticeSessionHeader }
