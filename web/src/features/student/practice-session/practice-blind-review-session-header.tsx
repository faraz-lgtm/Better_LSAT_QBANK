import type { ReactNode } from "react"
import { X } from "lucide-react"

import {
  PracticeBlindReviewSectionSelect,
  type BlindReviewSectionOption,
} from "@/features/student/practice-session/practice-blind-review-section-select"
import { ReviewIdeaIcon } from "@/features/student/practice-session/review-idea-icon"
import { cn } from "@/lib/utils"

export type PracticeReviewSidePanel = "explanation" | "insights" | "notes" | null

type PracticeBlindReviewSessionHeaderProps = {
  prepTestLabel: string
  sectionOptions: BlindReviewSectionOption[]
  activeSectionSessionId: string | null
  onSelectSection: (sectionSessionId: string) => void
  questionRef: string
  actualScoreLabel: string
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
  /** Figma `20596:144371` — more-menu trigger (dots) for Blind Review exam chrome */
  moreMenu?: ReactNode
}

function reviewHeaderActionButtonClass(active: boolean) {
  return cn(
    "box-border inline-flex h-10 shrink-0 items-center gap-2 rounded-[12px] border border-solid px-4 py-2 text-base font-medium leading-normal tracking-[0.32px] transition-colors",
    active
      ? "border-[var(--primary-border)] bg-[var(--primary)] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
      : "border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--greyscale-500)] hover:bg-[var(--greyscale-25)] hover:text-[var(--color-student-heading)]",
  )
}

function PracticeBlindReviewSessionHeader({
  prepTestLabel,
  sectionOptions,
  activeSectionSessionId,
  onSelectSection,
  questionRef,
  notesOpen,
  notesEnabled,
  onToggleNotes,
  onExitSection,
  exiting = false,
  showSectionSelect = true,
  chrome = "blind-review",
  sidePanel = null,
  onSidePanelChange,
  findQuery = "",
  onFindQueryChange,
  questionProgressLabel = null,
  reviewSideActions = ["explanation", "insights", "notes"],
  moreMenu = null,
}: PracticeBlindReviewSessionHeaderProps) {
  const isReviewChrome = chrome === "review"
  const showExplanationAction = reviewSideActions.includes("explanation")
  const showInsightsAction = reviewSideActions.includes("insights")
  const showNotesAction = reviewSideActions.includes("notes")
  const showAnySideAction = showExplanationAction || showInsightsAction || showNotesAction

  function toggleSidePanel(panel: Exclude<PracticeReviewSidePanel, null>) {
    if (!onSidePanelChange) return
    onSidePanelChange(sidePanel === panel ? null : panel)
  }

  /** Figma `20596:144371` / `20596:145049` — Blind Review exam header */
  if (!isReviewChrome) {
    return (
      <header className="practice-session-header absolute inset-x-0 top-0 z-10 flex h-[100px] flex-col bg-[var(--greyscale-0)]">
        <div className="flex h-[84px] shrink-0 items-center justify-between gap-6 px-10 py-6">
          <div className="practice-session-scroll-hidden flex min-w-0 flex-1 items-center gap-6 overflow-x-auto">
            <button
              type="button"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[var(--color-student-heading)] transition hover:bg-[var(--greyscale-25)]"
              aria-label="Exit blind review"
              onClick={onExitSection}
              disabled={exiting}
            >
              <X className="size-6" strokeWidth={2} aria-hidden />
            </button>
            <p className="m-0 shrink-0 text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">
              {prepTestLabel}
            </p>
            <input
              type="search"
              value={findQuery}
              onChange={(event) => onFindQueryChange?.(event.target.value)}
              placeholder="Find Text, Type Here"
              className="h-[52px] w-[262px] shrink-0 rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)] outline-none placeholder:text-[var(--greyscale-400)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
            />
          </div>

          <div className="flex h-[52px] shrink-0 items-center gap-2.5">
            {questionProgressLabel ? (
              <span className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
                {questionProgressLabel}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onToggleNotes}
              disabled={!notesEnabled}
              className={cn(
                "box-border inline-flex h-[52px] shrink-0 items-center gap-2 rounded-[16px] border border-solid px-4 py-2 text-base font-medium leading-normal tracking-[0.32px] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                notesOpen && notesEnabled
                  ? "border-[var(--primary-border)] bg-[var(--primary)] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
                  : "border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--greyscale-500)] hover:bg-[var(--greyscale-25)] hover:text-[var(--color-student-heading)]",
              )}
              aria-pressed={notesOpen && notesEnabled}
            >
              <BlindReviewNotesIcon className="size-5 shrink-0" />
              <span>Notes</span>
            </button>
            {moreMenu}
          </div>
        </div>
        <div className="relative mx-10 h-1 shrink-0 rounded-[5px] bg-[var(--greyscale-50)]">
          <div className="absolute inset-y-0 left-0 w-[176px] rounded-[5px] bg-[var(--primary)]" />
        </div>
      </header>
    )
  }

  return (
    <header className="practice-session-header absolute inset-x-0 top-0 z-10 flex h-[88px] flex-col bg-[var(--greyscale-0)]">
      <div className="flex h-[84px] shrink-0 items-center justify-between gap-6 px-10 py-6">
        <div className="practice-session-scroll-hidden flex min-w-0 flex-1 items-center gap-6 overflow-x-auto">
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[var(--color-student-heading)] transition hover:bg-[var(--greyscale-25)]"
            aria-label="Exit review"
            onClick={onExitSection}
            disabled={exiting}
          >
            <X className="size-6" strokeWidth={2} aria-hidden />
          </button>
          <p className="m-0 shrink-0 text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">
            {prepTestLabel}
          </p>
          <span className="shrink-0 text-xs font-medium leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">
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
            className="h-10 w-[262px] shrink-0 rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)] outline-none placeholder:text-[var(--greyscale-300)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
          />
        </div>

        <div className="flex shrink-0 items-center gap-6">
          {questionProgressLabel ? (
            <span className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
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
      <div className="relative h-1 shrink-0 bg-[var(--greyscale-100)]">
        <div className="absolute inset-y-0 left-10 w-[176px] rounded-[5px] bg-[var(--primary)]" />
      </div>
    </header>
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
