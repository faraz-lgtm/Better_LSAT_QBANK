import {
  ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_ARROW_COLUMN_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_CLUSTER_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_GRID_CLASS,
  ACTIVE_DRILL_FOOTER_ROW_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import {
  OFFICIAL_FOOTER_NAV_BUTTON_CLASS,
  OFFICIAL_FOOTER_NAV_CLUSTER_CLASS,
  OFFICIAL_FOOTER_NAV_GRID_CLASS,
  OFFICIAL_FOOTER_ROW_CLASS,
} from "@/features/student/practice-session/practice-session-official-styles"
import { PracticeSessionNavArrowButton } from "@/features/student/practice-session/practice-session-nav-arrow-button"
import type { PracticeSessionQuestionNavOutcome } from "@/features/student/practice-session/practice-session-question-nav-button"
import { PracticeSessionQuestionNavStrip } from "@/features/student/practice-session/practice-session-question-nav-strip"
import { isOfficialLayout, type PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type PracticeSessionActiveDrillFooterNavProps = {
  questions: ReadonlyArray<{ id: string; passage?: { id: string } | null; sourceGroupId?: string | null }>
  safeIndex: number
  answersByQuestion: Readonly<Record<string, unknown>>
  isFlagged: (questionId: string) => boolean
  variant: PracticeSessionVariant
  onSelectQuestion: (questionNumber: number) => void
  onPrev: () => void
  onNext: () => void
  /** Kept for callers; submit lives in the header more menu for LSAT default view. */
  onSubmit?: () => void
  submitLabel?: string
  /** When set, question pills show correct / incorrect / unanswered chrome. */
  outcomeForQuestion?: (questionId: string) => PracticeSessionQuestionNavOutcome | null | undefined
  showPassageBreaks?: boolean
  className?: string
}

function PracticeSessionActiveDrillFooterNav({
  questions,
  safeIndex,
  answersByQuestion,
  isFlagged,
  variant,
  onSelectQuestion,
  onPrev,
  onNext,
  onSubmit: _onSubmit,
  submitLabel: _submitLabel,
  outcomeForQuestion,
  showPassageBreaks = true,
  className,
}: PracticeSessionActiveDrillFooterNavProps) {
  const isLastQuestion = safeIndex >= questions.length
  const officialChrome = isOfficialLayout(variant)

  if (officialChrome) {
    return (
      <div className={cn(OFFICIAL_FOOTER_ROW_CLASS, className)}>
        <div className={OFFICIAL_FOOTER_NAV_CLUSTER_CLASS}>
          <button
            type="button"
            className={OFFICIAL_FOOTER_NAV_BUTTON_CLASS}
            disabled={safeIndex <= 1}
            aria-label="Previous question"
            onClick={onPrev}
          >
            Prev
          </button>
          <PracticeSessionQuestionNavStrip
            questions={questions}
            safeIndex={safeIndex}
            answersByQuestion={answersByQuestion}
            isFlagged={isFlagged}
            variant={variant}
            onSelectQuestion={onSelectQuestion}
            outcomeForQuestion={outcomeForQuestion}
            showPassageBreaks={showPassageBreaks}
            className={OFFICIAL_FOOTER_NAV_GRID_CLASS}
          />
          <button
            type="button"
            className={OFFICIAL_FOOTER_NAV_BUTTON_CLASS}
            disabled={isLastQuestion}
            aria-label="Next question"
            onClick={onNext}
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(ACTIVE_DRILL_FOOTER_ROW_CLASS, className)}>
      <div className={ACTIVE_DRILL_FOOTER_NAV_CLUSTER_CLASS}>
        <div className={ACTIVE_DRILL_FOOTER_NAV_ARROW_COLUMN_CLASS}>
          <PracticeSessionNavArrowButton
            direction="prev"
            disabled={safeIndex <= 1}
            iconOnly
            examArrow
            className={ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS}
            onClick={onPrev}
          />
        </div>
        <PracticeSessionQuestionNavStrip
          questions={questions}
          safeIndex={safeIndex}
          answersByQuestion={answersByQuestion}
          isFlagged={isFlagged}
          variant={variant}
          onSelectQuestion={onSelectQuestion}
          outcomeForQuestion={outcomeForQuestion}
          showPassageBreaks={showPassageBreaks}
          className={ACTIVE_DRILL_FOOTER_NAV_GRID_CLASS}
        />
        <div className={ACTIVE_DRILL_FOOTER_NAV_ARROW_COLUMN_CLASS}>
          <PracticeSessionNavArrowButton
            direction="next"
            disabled={isLastQuestion}
            iconOnly
            examArrow
            className={ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS}
            onClick={onNext}
          />
        </div>
      </div>
    </div>
  )
}

export { PracticeSessionActiveDrillFooterNav }
