import type { ReactNode } from "react"
import { useState } from "react"
import { Play } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  ACTIVE_DRILL_DESKTOP_HEADER_BLOCK_CLASS,
  ACTIVE_DRILL_FIND_TEXT_INPUT_CLASS,
  ACTIVE_DRILL_HEADER_CLOSE_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_ICON_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_LEFT_CLASS,
  ACTIVE_DRILL_HEADER_PILL_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_PILL_BUTTON_PRESSED_CLASS,
  ACTIVE_DRILL_HEADER_PROGRESS_CLASS,
  ACTIVE_DRILL_HEADER_PROGRESS_FILL_CLASS,
  ACTIVE_DRILL_HEADER_PROGRESS_TRACK_CLASS,
  ACTIVE_DRILL_HEADER_RIGHT_CLASS,
  ACTIVE_DRILL_HEADER_ROW_CLASS,
  ACTIVE_DRILL_HEADER_SHELL_CLASS,
  ACTIVE_DRILL_HEADER_STACK_CLASS,
  ACTIVE_DRILL_HEADER_TITLE_CLASS,
  ACTIVE_DRILL_MOBILE_FIND_INPUT_CLASS,
  ACTIVE_DRILL_MOBILE_HEADER_CLASS,
  ACTIVE_DRILL_MOBILE_HEADER_TITLE_BUTTON_CLASS,
  ACTIVE_DRILL_MOBILE_HEADER_TITLE_CLASS,
  ACTIVE_DRILL_MOBILE_META_RIGHT_CLASS,
  ACTIVE_DRILL_MOBILE_META_ROW_CLASS,
  ACTIVE_DRILL_MOBILE_PANE_TAB_ACTIVE_CLASS,
  ACTIVE_DRILL_MOBILE_PANE_TAB_CLASS,
  ACTIVE_DRILL_MOBILE_PANE_TAB_INACTIVE_CLASS,
  ACTIVE_DRILL_MOBILE_PANE_TABS_CLASS,
  ACTIVE_DRILL_MOBILE_TOOLS_BUTTON_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import {
  OFFICIAL_DESKTOP_HEADER_BLOCK_CLASS,
  OFFICIAL_FIND_TEXT_INPUT_CLASS,
  OFFICIAL_FIND_WRAP_CLASS,
  OFFICIAL_HEADER_CLOSE_BUTTON_CLASS,
  OFFICIAL_HEADER_LEFT_CLASS,
  OFFICIAL_HEADER_PAUSE_BUTTON_CLASS,
  OFFICIAL_HEADER_PILL_BUTTON_CLASS,
  OFFICIAL_HEADER_PILL_BUTTON_PRESSED_CLASS,
  OFFICIAL_HEADER_PROGRESS_FILL_CLASS,
  OFFICIAL_HEADER_PROGRESS_LABEL_CLASS,
  OFFICIAL_HEADER_PROGRESS_TRACK_CLASS,
  OFFICIAL_HEADER_RIGHT_CLASS,
  OFFICIAL_HEADER_SHELL_CLASS,
  OFFICIAL_HEADER_TIMER_WRAP_CLASS,
  OFFICIAL_HEADER_TITLE_CLASS,
  OFFICIAL_HEADER_TITLE_ROW_CLASS,
  OFFICIAL_HEADER_UTILITY_ROW_CLASS,
  OFFICIAL_MOBILE_FIND_ICON_CLASS,
  OFFICIAL_MOBILE_FIND_INPUT_CLASS,
  OFFICIAL_MOBILE_FIND_WRAP_CLASS,
  OFFICIAL_MOBILE_HEADER_CLASS,
  OFFICIAL_MOBILE_HEADER_CLOSE_CLASS,
  OFFICIAL_MOBILE_HEADER_TOOLS_CLASS,
  OFFICIAL_MOBILE_HEADER_TITLE_BUTTON_CLASS,
  OFFICIAL_MOBILE_HEADER_TITLE_CLASS,
  OFFICIAL_MOBILE_META_RIGHT_CLASS,
  OFFICIAL_MOBILE_META_ROW_CLASS,
  OFFICIAL_MOBILE_META_SECTION_CLASS,
  OFFICIAL_MOBILE_PANE_TAB_ACTIVE_CLASS,
  OFFICIAL_MOBILE_PANE_TAB_CLASS,
  OFFICIAL_MOBILE_PANE_TAB_INACTIVE_CLASS,
  OFFICIAL_MOBILE_PANE_TABS_CLASS,
} from "@/features/student/practice-session/practice-session-official-styles"
import { resolveExamProgress } from "@/features/student/practice-session/practice-session-exam-progress"
import {
  ExamHeaderCloseIcon,
  ExamHeaderPauseIcon,
  OfficialHeaderCloseIcon,
  OfficialHeaderSearchIcon,
  OfficialMobileFullscreenIcon,
  OfficialMobilePassageTabIcon,
  OfficialMobileTitleChevronIcon,
} from "@/features/student/practice-session/practice-session-header-icons"
import { PracticeSessionTimer } from "@/features/student/practice-session/practice-session-timer"
import { PracticeSessionToolbar } from "@/features/student/practice-session/practice-session-toolbar"
import {
  isOfficialLayout,
  type HighlightColor,
  type PracticeSessionVariant,
  type PracticeToolMode,
} from "@/features/student/practice-session/practice-session-types"
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
  passageOnlyView?: boolean
  onPassageOnlyViewChange?: (next: boolean) => void
  onDirections?: () => void
  /** Figma `21453:49878` — mobile header opens the tools menu rail */
  onOpenToolsMenu?: () => void
  toolsMenuOpen?: boolean
  /** Mobile meta row label — e.g. Reading / Logical Reasoning */
  sectionLabel?: string | null
  /** Figma `21452:48966` — Passage / Question tabs (mobile RC). `null` = both unselected. */
  mobilePane?: "passage" | "question" | null
  onMobilePaneChange?: (pane: "passage" | "question" | null) => void
  showMobilePaneTabs?: boolean
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
  passageOnlyView = false,
  onPassageOnlyViewChange,
  onDirections,
  onOpenToolsMenu,
  toolsMenuOpen = false,
  sectionLabel = null,
  mobilePane = null,
  onMobilePaneChange,
  showMobilePaneTabs = false,
}: PracticeSessionHeaderProps) {
  const isActiveDrill = variant === "active-drill"
  const officialChrome = isOfficialLayout(variant)
  const examProgress = resolveExamProgress({
    current: questionNumber,
    total: questionCount,
    label: questionProgressLabel,
  })
  const examProgressPct = examProgress.ratio * 100
  const [directionsOpen, setDirectionsOpen] = useState(false)
  const [mobilePaneMenuOpen, setMobilePaneMenuOpen] = useState(false)

  function openDirections() {
    if (onDirections) onDirections()
    else setDirectionsOpen(true)
  }

  if (officialChrome) {
    const canToggleMobilePaneMenu = Boolean(showMobilePaneTabs && onMobilePaneChange)

    return (
      <header className={OFFICIAL_HEADER_SHELL_CLASS}>
        {/* Figma `21453:49474` — mobile-only compact chrome */}
        <div className={OFFICIAL_MOBILE_HEADER_CLASS}>
          {onClose ? (
            <button
              type="button"
              className={OFFICIAL_MOBILE_HEADER_CLOSE_CLASS}
              aria-label="Close exam"
              onClick={onClose}
            >
              <OfficialHeaderCloseIcon />
            </button>
          ) : (
            <span aria-hidden />
          )}
          {canToggleMobilePaneMenu ? (
            <button
              type="button"
              className={OFFICIAL_MOBILE_HEADER_TITLE_BUTTON_CLASS}
              aria-label={`${title} menu`}
              aria-expanded={mobilePaneMenuOpen}
              aria-haspopup="listbox"
              onClick={() => setMobilePaneMenuOpen((open) => !open)}
            >
              <span className={cn(OFFICIAL_MOBILE_HEADER_TITLE_CLASS, titleClassName)} title={title}>
                {title}
              </span>
              <span className={cn("inline-flex transition-transform", mobilePaneMenuOpen && "rotate-180")}>
                <OfficialMobileTitleChevronIcon />
              </span>
            </button>
          ) : (
            <div className={OFFICIAL_MOBILE_HEADER_TITLE_BUTTON_CLASS}>
              <span className={cn(OFFICIAL_MOBILE_HEADER_TITLE_CLASS, titleClassName)} title={title}>
                {title}
              </span>
              <OfficialMobileTitleChevronIcon />
            </div>
          )}
          {onOpenToolsMenu ? (
            <button
              type="button"
              className={OFFICIAL_MOBILE_HEADER_TOOLS_CLASS}
              aria-label={toolsMenuOpen ? "Collapse tools menu" : "Open tools menu"}
              aria-expanded={toolsMenuOpen}
              aria-pressed={toolsMenuOpen}
              onClick={onOpenToolsMenu}
            >
              <OfficialMobileFullscreenIcon />
            </button>
          ) : (
            <span aria-hidden />
          )}
        </div>

        <div className={OFFICIAL_MOBILE_META_ROW_CLASS}>
          <p className={OFFICIAL_MOBILE_META_SECTION_CLASS}>{sectionLabel?.trim() || "\u00A0"}</p>
          <div className={OFFICIAL_MOBILE_META_RIGHT_CLASS}>
            {questionProgressLabel ? (
              <span className="whitespace-nowrap">
                {/^\d+\s+of\s+\d+$/i.test(questionProgressLabel.trim())
                  ? `Question ${questionProgressLabel.trim()}`
                  : questionProgressLabel}
              </span>
            ) : null}
            {questionProgressLabel && showTimer ? (
              <span className="h-3 w-px shrink-0 bg-[var(--greyscale-100)]" aria-hidden />
            ) : null}
            {showTimer ? (
              <PracticeSessionTimer
                layout="official"
                label=""
                displaySeconds={timerDisplaySeconds}
                paused={timerPaused}
                onPauseRequest={onTimerPauseRequest}
                onReset={onResetTimer}
                progress={timerProgress}
                displayClassName={cn("text-[12px] leading-[18px] text-[var(--greyscale-500)]", timerDisplayClassName)}
              />
            ) : null}
            {/* Same controls as desktop header right: pause + more menu */}
            {showTimer ? (
              <button
                type="button"
                className={OFFICIAL_HEADER_PAUSE_BUTTON_CLASS}
                aria-label={timerPaused ? "Section paused" : "Pause section timer"}
                onClick={onTimerPauseRequest}
              >
                {timerPaused ? (
                  <Play className="size-5 text-[var(--color-student-heading)]" strokeWidth={1.5} aria-hidden />
                ) : (
                  <ExamHeaderPauseIcon />
                )}
              </button>
            ) : null}
            {finishButton}
          </div>
        </div>

        <label className={OFFICIAL_MOBILE_FIND_WRAP_CLASS}>
          <input
            type="search"
            placeholder="Find Text, Type Here"
            value={findQuery}
            onChange={(e) => onFindQueryChange(e.target.value)}
            className={OFFICIAL_MOBILE_FIND_INPUT_CLASS}
            aria-label="Find text"
          />
          <span className={OFFICIAL_MOBILE_FIND_ICON_CLASS}>
            <OfficialHeaderSearchIcon />
          </span>
        </label>

        {canToggleMobilePaneMenu && mobilePaneMenuOpen ? (
          <div className={OFFICIAL_MOBILE_PANE_TABS_CLASS} role="listbox" aria-label="Reading view">
            <button
              type="button"
              role="option"
              aria-selected={mobilePane === "passage"}
              className={cn(
                OFFICIAL_MOBILE_PANE_TAB_CLASS,
                mobilePane === "passage" ? OFFICIAL_MOBILE_PANE_TAB_ACTIVE_CLASS : OFFICIAL_MOBILE_PANE_TAB_INACTIVE_CLASS,
              )}
              onClick={() => {
                // Tap again to unselect — both panes visible on mobile
                onMobilePaneChange?.(mobilePane === "passage" ? null : "passage")
                setMobilePaneMenuOpen(false)
              }}
            >
              <OfficialMobilePassageTabIcon active={mobilePane === "passage"} />
              Passage
            </button>
            <button
              type="button"
              role="option"
              aria-selected={mobilePane === "question"}
              className={cn(
                OFFICIAL_MOBILE_PANE_TAB_CLASS,
                mobilePane === "question" ? OFFICIAL_MOBILE_PANE_TAB_ACTIVE_CLASS : OFFICIAL_MOBILE_PANE_TAB_INACTIVE_CLASS,
              )}
              onClick={() => {
                onMobilePaneChange?.(mobilePane === "question" ? null : "question")
                setMobilePaneMenuOpen(false)
              }}
            >
              Question
            </button>
          </div>
        ) : null}

        <div className={OFFICIAL_DESKTOP_HEADER_BLOCK_CLASS}>
          <div className={OFFICIAL_HEADER_UTILITY_ROW_CLASS}>
            <div className={OFFICIAL_HEADER_LEFT_CLASS}>
              {onClose ? (
                <button
                  type="button"
                  className={OFFICIAL_HEADER_CLOSE_BUTTON_CLASS}
                  aria-label="Close exam"
                  onClick={onClose}
                >
                  <OfficialHeaderCloseIcon />
                </button>
              ) : null}
              <button type="button" className={OFFICIAL_HEADER_PILL_BUTTON_CLASS} onClick={openDirections}>
                Directions
              </button>
              <button
                type="button"
                className={cn(
                  OFFICIAL_HEADER_PILL_BUTTON_CLASS,
                  passageOnlyView && OFFICIAL_HEADER_PILL_BUTTON_PRESSED_CLASS,
                )}
                aria-pressed={passageOnlyView}
                aria-label="Passage Only View"
                onClick={() => onPassageOnlyViewChange?.(!passageOnlyView)}
              >
                Passage Only View
              </button>
              <label className={OFFICIAL_FIND_WRAP_CLASS}>
                <input
                  type="search"
                  placeholder="Find Text, Type Here"
                  value={findQuery}
                  onChange={(e) => onFindQueryChange(e.target.value)}
                  className={OFFICIAL_FIND_TEXT_INPUT_CLASS}
                />
                <OfficialHeaderSearchIcon />
              </label>
            </div>
            <div className={OFFICIAL_HEADER_RIGHT_CLASS}>
              {questionProgressLabel ? (
                <span className={OFFICIAL_HEADER_PROGRESS_LABEL_CLASS}>{questionProgressLabel}</span>
              ) : null}
              {showTimer ? (
                <div className={OFFICIAL_HEADER_TIMER_WRAP_CLASS}>
                  <PracticeSessionTimer
                    layout="official"
                    label=""
                    displaySeconds={timerDisplaySeconds}
                    paused={timerPaused}
                    onPauseRequest={onTimerPauseRequest}
                    onReset={onResetTimer}
                    progress={timerProgress}
                    displayClassName={timerDisplayClassName}
                  />
                  <button
                    type="button"
                    className={OFFICIAL_HEADER_PAUSE_BUTTON_CLASS}
                    aria-label={timerPaused ? "Section paused" : "Pause section timer"}
                    onClick={onTimerPauseRequest}
                  >
                    {timerPaused ? (
                      <Play className="size-6 text-[var(--color-student-heading)]" strokeWidth={1.5} aria-hidden />
                    ) : (
                      <ExamHeaderPauseIcon />
                    )}
                  </button>
                </div>
              ) : null}
              {finishButton}
            </div>
          </div>
          <div className={OFFICIAL_HEADER_TITLE_ROW_CLASS}>
            <p className={cn(OFFICIAL_HEADER_TITLE_CLASS, titleClassName)} title={title}>
              {title}
            </p>
          </div>
        </div>
        <div
          className={OFFICIAL_HEADER_PROGRESS_TRACK_CLASS}
          role="progressbar"
          aria-label="Exam progress"
          aria-valuemin={0}
          aria-valuemax={examProgress.total || 100}
          aria-valuenow={examProgress.current}
          aria-valuetext={
            examProgress.total > 0 ? `${examProgress.current} of ${examProgress.total}` : "No questions"
          }
        >
          <div className={OFFICIAL_HEADER_PROGRESS_FILL_CLASS} style={{ width: `${examProgressPct}%` }} />
        </div>
        {directionsOpen ? (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Directions"
            onClick={() => setDirectionsOpen(false)}
          >
            <div
              className="max-w-lg rounded-[12px] bg-[var(--greyscale-0)] p-5 text-[14px] leading-5 text-[var(--color-student-heading)] shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="mb-3 text-[18px] font-medium">Directions</p>
              <p>
                Choose the best answer for each question. You may use the tools in this interface to flag
                items, mask responses, and highlight text in the passage.
              </p>
              <button
                type="button"
                className={cn(OFFICIAL_HEADER_PILL_BUTTON_CLASS, "mt-4")}
                onClick={() => setDirectionsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </header>
    )
  }

  if (isActiveDrill) {
    const canToggleMobilePaneMenu = Boolean(showMobilePaneTabs && onMobilePaneChange)

    return (
      <header className={ACTIVE_DRILL_HEADER_SHELL_CLASS}>
        <div className={ACTIVE_DRILL_HEADER_STACK_CLASS}>
          {/* Mobile compact chrome — same Passage/Question dropdown as official */}
          <div className={ACTIVE_DRILL_MOBILE_HEADER_CLASS}>
            {onClose ? (
              <button
                type="button"
                className={ACTIVE_DRILL_HEADER_CLOSE_BUTTON_CLASS}
                aria-label="Close exam"
                onClick={onClose}
              >
                <ExamHeaderCloseIcon />
              </button>
            ) : (
              <span aria-hidden />
            )}
            {canToggleMobilePaneMenu ? (
              <button
                type="button"
                className={ACTIVE_DRILL_MOBILE_HEADER_TITLE_BUTTON_CLASS}
                aria-label={`${title} menu`}
                aria-expanded={mobilePaneMenuOpen}
                aria-haspopup="listbox"
                onClick={() => setMobilePaneMenuOpen((open) => !open)}
              >
                <span className={cn(ACTIVE_DRILL_MOBILE_HEADER_TITLE_CLASS, titleClassName)} title={title}>
                  {title}
                </span>
                <span className={cn("inline-flex transition-transform", mobilePaneMenuOpen && "rotate-180")}>
                  <OfficialMobileTitleChevronIcon />
                </span>
              </button>
            ) : (
              <div className={ACTIVE_DRILL_MOBILE_HEADER_TITLE_BUTTON_CLASS}>
                <span className={cn(ACTIVE_DRILL_MOBILE_HEADER_TITLE_CLASS, titleClassName)} title={title}>
                  {title}
                </span>
              </div>
            )}
            {onOpenToolsMenu ? (
              <button
                type="button"
                className={ACTIVE_DRILL_MOBILE_TOOLS_BUTTON_CLASS}
                aria-label={toolsMenuOpen ? "Collapse tools menu" : "Open tools menu"}
                aria-expanded={toolsMenuOpen}
                aria-pressed={toolsMenuOpen}
                onClick={onOpenToolsMenu}
              >
                <OfficialMobileFullscreenIcon />
              </button>
            ) : (
              <span aria-hidden />
            )}
          </div>

          <div className={ACTIVE_DRILL_MOBILE_META_ROW_CLASS}>
            {questionProgressLabel ? (
              <span className={ACTIVE_DRILL_HEADER_PROGRESS_CLASS}>{questionProgressLabel}</span>
            ) : (
              <span aria-hidden />
            )}
            <div className={ACTIVE_DRILL_MOBILE_META_RIGHT_CLASS}>
              {showTimer ? (
                <PracticeSessionTimer
                  layout="inline"
                  label=""
                  displaySeconds={timerDisplaySeconds}
                  paused={timerPaused}
                  onPauseRequest={onTimerPauseRequest}
                  onReset={onResetTimer}
                  progress={timerProgress}
                  displayClassName={cn("!mr-0 text-[12px]", timerDisplayClassName)}
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
                    <Play className="size-5 text-[var(--color-student-heading)]" strokeWidth={1.5} aria-hidden />
                  ) : (
                    <ExamHeaderPauseIcon />
                  )}
                </button>
              ) : null}
              {finishButton}
            </div>
          </div>

          <input
            type="search"
            placeholder="Find Text, Type Here"
            value={findQuery}
            onChange={(e) => onFindQueryChange(e.target.value)}
            className={ACTIVE_DRILL_MOBILE_FIND_INPUT_CLASS}
            aria-label="Find text"
          />

          {canToggleMobilePaneMenu && mobilePaneMenuOpen ? (
            <div className={ACTIVE_DRILL_MOBILE_PANE_TABS_CLASS} role="listbox" aria-label="Reading view">
              <button
                type="button"
                role="option"
                aria-selected={mobilePane === "passage"}
                className={cn(
                  ACTIVE_DRILL_MOBILE_PANE_TAB_CLASS,
                  mobilePane === "passage"
                    ? ACTIVE_DRILL_MOBILE_PANE_TAB_ACTIVE_CLASS
                    : ACTIVE_DRILL_MOBILE_PANE_TAB_INACTIVE_CLASS,
                )}
                onClick={() => {
                  onMobilePaneChange?.(mobilePane === "passage" ? null : "passage")
                  setMobilePaneMenuOpen(false)
                }}
              >
                <OfficialMobilePassageTabIcon active={mobilePane === "passage"} />
                Passage
              </button>
              <button
                type="button"
                role="option"
                aria-selected={mobilePane === "question"}
                className={cn(
                  ACTIVE_DRILL_MOBILE_PANE_TAB_CLASS,
                  mobilePane === "question"
                    ? ACTIVE_DRILL_MOBILE_PANE_TAB_ACTIVE_CLASS
                    : ACTIVE_DRILL_MOBILE_PANE_TAB_INACTIVE_CLASS,
                )}
                onClick={() => {
                  onMobilePaneChange?.(mobilePane === "question" ? null : "question")
                  setMobilePaneMenuOpen(false)
                }}
              >
                Question
              </button>
            </div>
          ) : null}

          <div className={ACTIVE_DRILL_DESKTOP_HEADER_BLOCK_CLASS}>
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
                <button
                  type="button"
                  className={cn(
                    ACTIVE_DRILL_HEADER_PILL_BUTTON_CLASS,
                    passageOnlyView && ACTIVE_DRILL_HEADER_PILL_BUTTON_PRESSED_CLASS,
                  )}
                  aria-pressed={passageOnlyView}
                  onClick={() => onPassageOnlyViewChange?.(!passageOnlyView)}
                >
                  Passage Only View
                </button>
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
                      <Play className="size-6 text-[var(--color-student-heading)]" strokeWidth={1.5} aria-hidden />
                    ) : (
                      <ExamHeaderPauseIcon />
                    )}
                  </button>
                ) : null}
                {finishButton}
              </div>
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
        "practice-session-header flex shrink-0 items-center gap-3 overflow-hidden border-b border-[var(--greyscale-100)] bg-[var(--greyscale-50)] px-6 py-3 md:gap-4",
        "min-h-[80px]",
      )}
    >
      <div className="min-w-0 flex-1 basis-0 overflow-hidden pr-1">
        <p
          className={cn(
            "m-0 truncate font-bold text-[var(--color-student-heading)]",
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
              "h-[52px] rounded-2xl border border-[var(--greyscale-100)] pl-4 pr-4 text-sm shadow-[0px_1px_1px_rgba(13,13,18,0.06)] placeholder:text-[var(--greyscale-400)]",
              isActiveDrill ? "w-[200px] bg-[var(--greyscale-25)]" : "w-[160px] bg-[var(--greyscale-25)] pl-10 xl:w-[200px]",
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
