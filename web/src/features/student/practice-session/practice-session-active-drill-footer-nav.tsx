import {
  ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_ARROW_COLUMN_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_CLUSTER_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_GRID_CLASS,
  ACTIVE_DRILL_FOOTER_ROW_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_FLAG_SLOT_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { PracticeSessionNavArrowButton } from "@/features/student/practice-session/practice-session-nav-arrow-button"
import type { PracticeSessionQuestionNavOutcome } from "@/features/student/practice-session/practice-session-question-nav-button"
import { PracticeSessionQuestionNavStrip } from "@/features/student/practice-session/practice-session-question-nav-strip"
import type { PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
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
  /** When on the last question, replaces the disabled Next control. */
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
  onSubmit,
  submitLabel = "Submit",
  outcomeForQuestion,
  showPassageBreaks = true,
  className,
}: PracticeSessionActiveDrillFooterNavProps) {
  const isLastQuestion = safeIndex >= questions.length

  return (
    <div className={cn(ACTIVE_DRILL_FOOTER_ROW_CLASS, className)}>
      <div className={ACTIVE_DRILL_FOOTER_NAV_CLUSTER_CLASS}>
        <div className={ACTIVE_DRILL_FOOTER_NAV_ARROW_COLUMN_CLASS}>
          <span className={ACTIVE_DRILL_QUESTION_NAV_FLAG_SLOT_CLASS} aria-hidden />
          <PracticeSessionNavArrowButton
            direction="prev"
            disabled={safeIndex <= 1}
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
          <span className={ACTIVE_DRILL_QUESTION_NAV_FLAG_SLOT_CLASS} aria-hidden />
          {isLastQuestion && onSubmit ? (
            <button
              type="button"
              className={cn(
                ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS,
                "min-w-[88px] border-[#0d47a1] bg-[#0d47a1] text-white hover:bg-[#0a3d8a]",
              )}
              onClick={onSubmit}
            >
              {submitLabel}
            </button>
          ) : (
            <PracticeSessionNavArrowButton
              direction="next"
              disabled={isLastQuestion}
              className={ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS}
              onClick={onNext}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export { PracticeSessionActiveDrillFooterNav }
