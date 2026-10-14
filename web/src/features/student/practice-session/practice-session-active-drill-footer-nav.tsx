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
  OFFICIAL_MOBILE_FOOTER_CENTER_CLASS,
  OFFICIAL_MOBILE_FOOTER_CLASS,
  OFFICIAL_MOBILE_FOOTER_NEXT_CLASS,
  OFFICIAL_MOBILE_FOOTER_PREV_CLASS,
} from "@/features/student/practice-session/practice-session-official-styles"
import { PracticeSessionNavArrowButton } from "@/features/student/practice-session/practice-session-nav-arrow-button"
import type { PracticeSessionQuestionNavOutcome } from "@/features/student/practice-session/practice-session-question-nav-button"
import { PracticeSessionQuestionNavStrip } from "@/features/student/practice-session/practice-session-question-nav-strip"
import { isOfficialLayout, type PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type PracticeSessionActiveDrillFooterNavProps = {
  questions: ReadonlyArray<{
    id: string
    passage?: { id: string } | null
    sourceGroupId?: string | null
    difficulty?: number | null
  }>
  safeIndex: number
  answersByQuestion: Readonly<Record<string, unknown>>
  isFlagged: (questionId: string) => boolean
  variant: PracticeSessionVariant
  onSelectQuestion: (questionNumber: number) => void
  onPrev: () => void
  onNext: () => void
  /** When false, Next stays enabled on the last question (e.g. unlimited drills). Default true. */
  disableNextAtLast?: boolean
  /** When set, last question morphs Next into Submit (header more menu remains available). */
  onSubmit?: () => void
  submitLabel?: string
  /** Figma `21452:49123` — mobile center control opens the question review panel. */
  onOpenReview?: () => void
  reviewOpen?: boolean
  /** When set, question pills show correct / incorrect / unanswered chrome. */
  outcomeForQuestion?: (questionId: string) => PracticeSessionQuestionNavOutcome | null | undefined
  showPassageBreaks?: boolean
  className?: string
}

function OfficialMobileFooterIcon({
  src,
  size,
  className,
}: {
  src: string
  size: number
  className?: string
}) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn("max-w-none shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
      draggable={false}
      aria-hidden
    />
  )
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
  disableNextAtLast = true,
  onSubmit,
  submitLabel = "Submit",
  onOpenReview,
  reviewOpen = false,
  outcomeForQuestion,
  showPassageBreaks = true,
  className,
}: PracticeSessionActiveDrillFooterNavProps) {
  const isLastQuestion = safeIndex >= questions.length
  const showSubmit = Boolean(isLastQuestion && disableNextAtLast && onSubmit)
  const nextDisabled = disableNextAtLast && isLastQuestion && !showSubmit
  const officialChrome = isOfficialLayout(variant)
  const questionTotal = questions.length
  const currentQuestion = Math.min(Math.max(safeIndex, 1), Math.max(questionTotal, 1))

  if (officialChrome) {
    return (
      <div className={cn(OFFICIAL_FOOTER_ROW_CLASS, className)}>
        {/* Figma `21452:49123` — mobile only */}
        <div className={OFFICIAL_MOBILE_FOOTER_CLASS}>
          <button
            type="button"
            className={OFFICIAL_MOBILE_FOOTER_PREV_CLASS}
            disabled={safeIndex <= 1}
            aria-label="Previous question"
            onClick={onPrev}
          >
            <OfficialMobileFooterIcon src="/figma/exam-official/mobile-footer-prev.svg" size={19} />
          </button>
          <button
            type="button"
            className={OFFICIAL_MOBILE_FOOTER_CENTER_CLASS}
            aria-label={`Question ${currentQuestion} of ${questionTotal}`}
            aria-expanded={reviewOpen}
            onClick={onOpenReview}
          >
            <OfficialMobileFooterIcon src="/figma/exam-official/mobile-footer-list.svg" size={17} />
            <span className="min-w-0 truncate">
              Question{" "}
              <span className="font-bold text-[#18263c]">{currentQuestion}</span>
              {` of ${questionTotal}`}
            </span>
          </button>
          {showSubmit ? (
            <button
              type="button"
              className={OFFICIAL_MOBILE_FOOTER_NEXT_CLASS}
              aria-label={submitLabel}
              onClick={onSubmit}
            >
              <OfficialMobileFooterIcon src="/figma/exam-official/mobile-footer-next.svg" size={19} />
            </button>
          ) : (
            <button
              type="button"
              className={OFFICIAL_MOBILE_FOOTER_NEXT_CLASS}
              disabled={nextDisabled}
              aria-label="Next question"
              onClick={onNext}
            >
              <OfficialMobileFooterIcon src="/figma/exam-official/mobile-footer-next.svg" size={19} />
            </button>
          )}
        </div>

        {/* Desktop LawHub pill strip */}
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
          {showSubmit ? (
            <button
              type="button"
              className={OFFICIAL_FOOTER_NAV_BUTTON_CLASS}
              aria-label={submitLabel}
              onClick={onSubmit}
            >
              {submitLabel}
            </button>
          ) : (
            <button
              type="button"
              className={OFFICIAL_FOOTER_NAV_BUTTON_CLASS}
              disabled={nextDisabled}
              aria-label="Next question"
              onClick={onNext}
            >
              Next
            </button>
          )}
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
          {showSubmit ? (
            <button
              type="button"
              className={OFFICIAL_FOOTER_NAV_BUTTON_CLASS}
              aria-label={submitLabel}
              onClick={onSubmit}
            >
              {submitLabel}
            </button>
          ) : (
            <PracticeSessionNavArrowButton
              direction="next"
              disabled={nextDisabled}
              iconOnly
              examArrow
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
