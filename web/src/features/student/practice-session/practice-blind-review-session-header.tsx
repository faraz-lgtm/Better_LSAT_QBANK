import { EyeOff, X } from "lucide-react"

import type { BlindReviewAnswerView } from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import {
  PracticeBlindReviewSectionSelect,
  type BlindReviewSectionOption,
} from "@/features/student/practice-session/practice-blind-review-section-select"
import { ReviewIdeaIcon } from "@/features/student/practice-session/review-idea-icon"
import {
  BLIND_REVIEW_HEADER_CLASS,
  BLIND_REVIEW_HEADER_EXIT_BUTTON_CLASS,
  BLIND_REVIEW_HEADER_NOTES_BUTTON_ACTIVE_CLASS,
  BLIND_REVIEW_HEADER_NOTES_BUTTON_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import { PracticeSessionToolbar } from "@/features/student/practice-session/practice-session-toolbar"
import type { HighlightColor, PracticeToolMode } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

export type PracticeReviewSidePanel = "explanation" | "insights" | "notes" | null

type PracticeBlindReviewSessionHeaderProps = {
  prepTestLabel: string
  sectionOptions: BlindReviewSectionOption[]
  activeSectionSessionId: string | null
  onSelectSection: (sectionSessionId: string) => void
  questionRef: string
  actualScoreLabel: string
  answerView: BlindReviewAnswerView
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
  notesOpen: boolean
  notesEnabled: boolean
  onToggleNotes: () => void
  onExitSection: () => void
  exiting?: boolean
  showSectionSelect?: boolean
  exitButtonLabel?: string
  exitingLabel?: string
  /** Figma `18617:33941` — post-results Review chrome */
  chrome?: "blind-review" | "review"
  sidePanel?: PracticeReviewSidePanel
  onSidePanelChange?: (panel: PracticeReviewSidePanel) => void
  findQuery?: string
  onFindQueryChange?: (value: string) => void
  questionProgressLabel?: string | null
  /**
   * Review chrome header actions. Default shows all three.
   * Pass a subset (e.g. `["insights"]`) for diagnostic.
   */
  reviewSideActions?: Array<"explanation" | "insights" | "notes">
}

function reviewHeaderActionButtonClass(active: boolean) {
  return cn(
    "box-border inline-flex h-10 shrink-0 items-center gap-2 rounded-[12px] border border-solid px-4 py-2 text-base font-medium leading-normal tracking-[0.32px] transition-colors",
    active
      ? "border-[#0b4e6e] bg-[#0d47a1] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
      : "border-[#dfe1e7] bg-white text-[#666d80] hover:bg-[#f6f8fa] hover:text-[#062357]",
  )
}

function PracticeBlindReviewSessionHeader({
  prepTestLabel,
  sectionOptions,
  activeSectionSessionId,
  onSelectSection,
  questionRef,
  actualScoreLabel,
  answerView,
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
  notesOpen,
  notesEnabled,
  onToggleNotes,
  onExitSection,
  exiting = false,
  showSectionSelect = true,
  exitButtonLabel = "Exit Section",
  exitingLabel = "Exiting…",
  chrome = "blind-review",
  sidePanel = null,
  onSidePanelChange,
  findQuery = "",
  onFindQueryChange,
  questionProgressLabel = null,
  reviewSideActions = ["explanation", "insights", "notes"],
}: PracticeBlindReviewSessionHeaderProps) {
  const isReviewChrome = chrome === "review"
  const blindReviewView = answerView === "blind_review"
  const showExplanationAction = reviewSideActions.includes("explanation")
  const showInsightsAction = reviewSideActions.includes("insights")
  const showNotesAction = reviewSideActions.includes("notes")
  const showAnySideAction = showExplanationAction || showInsightsAction || showNotesAction

  function toggleSidePanel(panel: Exclude<PracticeReviewSidePanel, null>) {
    if (!onSidePanelChange) return
    onSidePanelChange(sidePanel === panel ? null : panel)
  }

  if (isReviewChrome) {
    return (
      <header className="practice-session-header absolute inset-x-0 top-0 z-10 flex h-[88px] flex-col bg-white">
        <div className="flex h-[84px] shrink-0 items-center justify-between gap-6 px-10 py-6">
          <div className="practice-session-scroll-hidden flex min-w-0 flex-1 items-center gap-6 overflow-x-auto">
            <button
              type="button"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#0d0d12] transition hover:bg-[#f6f8fa]"
              aria-label="Exit review"
              onClick={onExitSection}
              disabled={exiting}
            >
              <X className="size-6" strokeWidth={2} aria-hidden />
            </button>
            <p className="m-0 shrink-0 text-2xl font-bold leading-[1.3] text-[#062357]">
              {prepTestLabel}
            </p>
            <span className="shrink-0 text-xs font-medium leading-[1.5] tracking-[0.24px] text-[#666d80]">
              {questionRef}
            </span>
            {showSectionSelect ? (
              <PracticeBlindReviewSectionSelect
                sections={sectionOptions}
                activeSectionSessionId={activeSectionSessionId}
                onSelect={onSelectSection}
              />
            ) : null}
            <input
              type="search"
              value={findQuery}
              onChange={(event) => onFindQueryChange?.(event.target.value)}
              placeholder="Find Text, Type Here"
              className="h-10 w-[262px] shrink-0 rounded-[12px] border border-[#dfe1e7] bg-white px-4 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[#062357] outline-none placeholder:text-[#818898] focus:border-[#0d47a1] focus:ring-2 focus:ring-[#0d47a1]/10"
            />
          </div>

          <div className="flex shrink-0 items-center gap-6">
            {questionProgressLabel ? (
              <span className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#666d80]">
                {questionProgressLabel}
              </span>
            ) : null}
            {showAnySideAction ? (
              <>
                {showExplanationAction ? (
                  <button
                    type="button"
                    className={reviewHeaderActionButtonClass(sidePanel === "explanation")}
                    aria-pressed={sidePanel === "explanation"}
                    onClick={() => toggleSidePanel("explanation")}
                  >
                    <ReviewIdeaIcon className="size-5 shrink-0" />
                    <span>Video Explanation</span>
                  </button>
                ) : null}
                {showInsightsAction ? (
                  <button
                    type="button"
                    className={reviewHeaderActionButtonClass(sidePanel === "insights")}
                    aria-pressed={sidePanel === "insights"}
                    onClick={() => toggleSidePanel("insights")}
                  >
                    <ReviewInsightsIcon className="size-5 shrink-0" />
                    <span>Insights</span>
                  </button>
                ) : null}
                {showNotesAction ? (
                  <button
                    type="button"
                    className={reviewHeaderActionButtonClass(sidePanel === "notes")}
                    aria-pressed={sidePanel === "notes"}
                    onClick={() => toggleSidePanel("notes")}
                  >
                    <BlindReviewNotesIcon className="size-5 shrink-0" />
                    <span>Notes</span>
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
        <div className="relative h-1 shrink-0 bg-[#dfe1e7]">
          <div className="absolute inset-y-0 left-10 w-[176px] rounded-[5px] bg-[#0d47a1]" />
        </div>
      </header>
    )
  }

  return (
    <header className={BLIND_REVIEW_HEADER_CLASS}>
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 md:gap-6">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <p className="shrink-0 text-xl font-bold leading-[1.35] text-[#062357]">{prepTestLabel}</p>
            {showSectionSelect ? (
              <PracticeBlindReviewSectionSelect
                sections={sectionOptions}
                activeSectionSessionId={activeSectionSessionId}
                onSelect={onSelectSection}
              />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {isReviewChrome ? (
              <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#fff3ea] px-4 text-xs font-medium tracking-[0.24px] text-[#ff6f00]">
                <ReviewBadgeIcon className="size-3 shrink-0" />
                Review
              </span>
            ) : (
              <>
                <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#fff3ea] px-4 text-xs font-medium tracking-[0.24px] text-[#ff6f00]">
                  <EyeOff className="size-3 shrink-0" aria-hidden />
                  Blind Review
                </span>
                <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-[#fff6e0] px-4 text-xs font-medium tracking-[0.24px] text-[#956321]">
                  {actualScoreLabel}
                </span>
              </>
            )}
            <span className="min-w-0 truncate text-xs font-medium tracking-[0.24px] text-[#666d80]">
              {questionRef}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 md:gap-6">
          <>
              {blindReviewView ? (
                <PracticeSessionToolbar
                  variant="blind-review"
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
              ) : null}

              <button
                type="button"
                onClick={onToggleNotes}
                disabled={!notesEnabled}
                className={cn(
                  BLIND_REVIEW_HEADER_NOTES_BUTTON_CLASS,
                  notesOpen && notesEnabled && BLIND_REVIEW_HEADER_NOTES_BUTTON_ACTIVE_CLASS,
                )}
                aria-pressed={notesOpen && notesEnabled}
              >
                <BlindReviewNotesIcon className="size-5 shrink-0" />
                <span className="hidden sm:inline">Notes</span>
              </button>

              <button
                type="button"
                className={BLIND_REVIEW_HEADER_EXIT_BUTTON_CLASS}
                onClick={onExitSection}
                disabled={exiting}
              >
                {exiting ? exitingLabel : exitButtonLabel}
              </button>
          </>
        </div>
      </div>
    </header>
  )
}

/** Figma `18617:33953` — Review badge glyph */
function ReviewBadgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M5.36719 2.53775C6.53188 2.39895 7.70999 2.64516 8.72162 3.23878C9.73325 3.83239 10.5228 4.74079 10.9697 5.82525C11.0114 5.93751 11.0114 6.06099 10.9697 6.17325C10.7859 6.61875 10.5431 7.0375 10.2477 7.41825"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.04207 7.07803C6.75916 7.35127 6.38026 7.50246 5.98697 7.49904C5.59367 7.49562 5.21745 7.33787 4.93934 7.05976C4.66123 6.78165 4.50347 6.40543 4.50006 6.01213C4.49664 5.61884 4.64783 5.23993 4.92107 4.95703"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.73975 8.74891C8.07649 9.14179 7.33648 9.38741 6.56993 9.4691C5.80338 9.55079 5.02823 9.46664 4.29707 9.22235C3.56591 8.97806 2.89585 8.57935 2.33236 8.05328C1.76887 7.52721 1.32513 6.88608 1.03125 6.17341C0.989582 6.06115 0.989582 5.93766 1.03125 5.82541C1.47457 4.75033 2.25459 3.84803 3.25425 3.25391"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1 1L11 11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Figma `line-chart-up-01` */
function ReviewInsightsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 17 17" fill="none" aria-hidden>
      <path
        d="M0.833333 0.833333V12.5C0.833333 14.3409 2.32572 15.8333 4.16667 15.8333H15.8333M5 10.8333L6.37484 7.39622C6.53871 6.98655 6.99351 6.77561 7.4121 6.91514L10.9212 8.08486C11.3398 8.22438 11.7946 8.01345 11.9585 7.60378L13.3333 4.16667"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Figma `huge-icon/education/outline/assignment` — 20×20, stroke follows text color */
function BlindReviewNotesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M11.6667 17.5H10C8.15905 17.5 6.66667 16.0076 6.66667 14.1667V5.83333C6.66667 3.99238 8.15905 2.5 10 2.5H15C16.8409 2.5 18.3333 3.99238 18.3333 5.83333V11.6667M1.66667 5.83333H4.16667M10 5.83333H15M10 9.16667H15M10 12.5H12.5M13.3333 15.8333L14.794 17.0019C15.1422 17.2805 15.6481 17.2355 15.9417 16.8999L18.3333 14.1667M2.91667 17.5L3.5 16.7222C3.93274 16.1452 4.16667 15.4435 4.16667 14.7222V3.75C4.16667 3.05964 3.60702 2.5 2.91667 2.5C2.22631 2.5 1.66667 3.05964 1.66667 3.75V14.7222C1.66667 15.4435 1.90059 16.1452 2.33333 16.7222L2.91667 17.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { PracticeBlindReviewSessionHeader }
