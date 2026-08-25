import type { ReactNode } from "react"
import { Play } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  ACTIVE_DRILL_FIND_TEXT_INPUT_CLASS,
  ACTIVE_DRILL_HEADER_CLOSE_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_ICON_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_LEFT_CLASS,
  ACTIVE_DRILL_HEADER_PROGRESS_CLASS,
  ACTIVE_DRILL_HEADER_PROGRESS_FILL_CLASS,
  ACTIVE_DRILL_HEADER_PROGRESS_TRACK_CLASS,
  ACTIVE_DRILL_HEADER_RIGHT_CLASS,
  ACTIVE_DRILL_HEADER_ROW_CLASS,
  ACTIVE_DRILL_HEADER_SHELL_CLASS,
  ACTIVE_DRILL_HEADER_STACK_CLASS,
  ACTIVE_DRILL_HEADER_TITLE_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { resolveExamProgress } from "@/features/student/practice-session/practice-session-exam-progress"
import {
  ExamHeaderCloseIcon,
  ExamHeaderPauseIcon,
} from "@/features/student/practice-session/practice-session-header-icons"
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
  onTimerPauseRequest: () => void
  onResetTimer?: () => void
  timerProgress: number
  timerDisplayClassName?: string
  showTimer?: boolean
  titleClassName?: string
  questionProgressLabel?: string | null
  questionNumber?: number
  questionCount?: number
  finishButton: ReactNode
  onClose?: () => void
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
  onTimerPauseRequest,
  onResetTimer,
  timerProgress,
  timerDisplayClassName,
  showTimer = true,
  titleClassName,
  questionProgressLabel,
  questionNumber,
  questionCount,
  finishButton,
  onClose,
}: PracticeSessionHeaderProps) {
  const isActiveDrill = variant === "active-drill"
  const examProgress = resolveExamProgress({
    current: questionNumber,
    total: questionCount,
    label: questionProgressLabel,
  })
  const examProgressPct = examProgress.ratio * 100

  if (isActiveDrill) {
    return (
      <header className={ACTIVE_DRILL_HEADER_SHELL_CLASS}>
        <div className={ACTIVE_DRILL_HEADER_STACK_CLASS}>
          <div className={ACTIVE_DRILL_HEADER_ROW_CLASS}>
            <div className={ACTIVE_DRILL_HEADER_LEFT_CLASS}>
              {onClose ? (
                <button
                  type="button"
                  className={ACTIVE_DRILL_HEADER_CLOSE_BUTTON_CLASS}
                  aria-label="Close exam"
                  onClick={onClose}
                >
                  <ExamHeaderCloseIcon />
                </button>
              ) : null}
              <p className={cn(ACTIVE_DRILL_HEADER_TITLE_CLASS, titleClassName)} title={title}>
                {title}
              </p>
              <input
                type="search"
                placeholder="Find Text, Type Here"
                value={findQuery}
                onChange={(e) => onFindQueryChange(e.target.value)}
                className={ACTIVE_DRILL_FIND_TEXT_INPUT_CLASS}
              />
            </div>
            <div className={ACTIVE_DRILL_HEADER_RIGHT_CLASS}>
              {questionProgressLabel ? (
                <span className={ACTIVE_DRILL_HEADER_PROGRESS_CLASS}>{questionProgressLabel}</span>
              ) : null}
              {showTimer ? (
                <PracticeSessionTimer
                  layout="inline"
                  label={timerLabel}
                  displaySeconds={timerDisplaySeconds}
                  paused={timerPaused}
                  onPauseRequest={onTimerPauseRequest}
                  onReset={onResetTimer}
                  progress={timerProgress}
                  displayClassName={timerDisplayClassName}
                />
              ) : null}
              {showTimer ? (
                <button
                  type="button"
                  className={ACTIVE_DRILL_HEADER_ICON_BUTTON_CLASS}
                  aria-label={timerPaused ? "Section paused" : "Pause section timer"}
                  onClick={onTimerPauseRequest}
                >
                  {timerPaused ? (
                    <Play className="size-6 text-[#6A7282]" strokeWidth={1.5} aria-hidden />
                  ) : (
                    <ExamHeaderPauseIcon />
                  )}
                </button>
              ) : null}
              {finishButton}
            </div>
          </div>
          <div
            className={ACTIVE_DRILL_HEADER_PROGRESS_TRACK_CLASS}
            role="progressbar"
            aria-label="Exam progress"
            aria-valuemin={0}
            aria-valuemax={examProgress.total || 100}
            aria-valuenow={examProgress.current}
            aria-valuetext={
              examProgress.total > 0 ? `${examProgress.current} of ${examProgress.total}` : "No questions"
            }
          >
            <div
              className={ACTIVE_DRILL_HEADER_PROGRESS_FILL_CLASS}
              style={{ width: `${examProgressPct}%` }}
            />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className={cn(
        "practice-session-header flex shrink-0 items-center gap-3 overflow-hidden border-b border-[#dfe1e7] px-6 py-3 md:gap-4",
        "min-h-[80px] bg-[#eceff3]",
      )}
    >
      <div className="min-w-0 flex-1 basis-0 overflow-hidden pr-1">
        <p
          className={cn(
            "m-0 truncate font-bold text-[#062357]",
            isActiveDrill ? "text-[24px] leading-[1.3]" : "text-lg leading-tight md:text-xl",
          )}
          title={title}
        >
          {title}
        </p>
      </div>
      <div className="practice-session-header-actions flex shrink-0 items-center gap-2 md:gap-3">
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
            onPauseRequest={onTimerPauseRequest}
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
