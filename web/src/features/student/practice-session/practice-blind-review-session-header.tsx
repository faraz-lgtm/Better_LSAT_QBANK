import { EyeOff } from "lucide-react"

import type { BlindReviewAnswerView } from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import {
  PracticeBlindReviewSectionSelect,
  type BlindReviewSectionOption,
} from "@/features/student/practice-session/practice-blind-review-section-select"
import {
  BLIND_REVIEW_HEADER_CLASS,
  BLIND_REVIEW_HEADER_EXIT_BUTTON_CLASS,
  BLIND_REVIEW_HEADER_NOTES_BUTTON_ACTIVE_CLASS,
  BLIND_REVIEW_HEADER_NOTES_BUTTON_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import { PracticeSessionToolbar } from "@/features/student/practice-session/practice-session-toolbar"
import type { HighlightColor, PracticeToolMode } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

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
}: PracticeBlindReviewSessionHeaderProps) {
  const blindReviewView = answerView === "blind_review"

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
            <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#fff3ea] px-4 text-xs font-medium tracking-[0.24px] text-[#ff6f00]">
              <EyeOff className="size-3 shrink-0" aria-hidden />
              Blind Review
            </span>
            <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-[#fff6e0] px-4 text-xs font-medium tracking-[0.24px] text-[#956321]">
              {actualScoreLabel}
            </span>
            <span className="min-w-0 truncate text-xs font-medium tracking-[0.24px] text-[#666d80]">
              {questionRef}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 md:gap-6">
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
        </div>
      </div>
    </header>
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
