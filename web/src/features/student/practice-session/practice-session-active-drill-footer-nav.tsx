import {
  ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_ARROW_COLUMN_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_CLUSTER_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_GRID_CLASS,
  ACTIVE_DRILL_FOOTER_ROW_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_FLAG_SLOT_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { PracticeSessionNavArrowButton } from "@/features/student/practice-session/practice-session-nav-arrow-button"
import { PracticeSessionQuestionNavButton } from "@/features/student/practice-session/practice-session-question-nav-button"
import type { PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type PracticeSessionActiveDrillFooterNavProps = {
  questions: ReadonlyArray<{ id: string }>
  safeIndex: number
  answersByQuestion: Readonly<Record<string, unknown>>
  isFlagged: (questionId: string) => boolean
  variant: PracticeSessionVariant
  onSelectQuestion: (questionNumber: number) => void
  onPrev: () => void
  onNext: () => void
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
  className,
}: PracticeSessionActiveDrillFooterNavProps) {
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
        <div className={ACTIVE_DRILL_FOOTER_NAV_GRID_CLASS}>
          {questions.map((q, i) => {
            const n = i + 1
            return (
              <PracticeSessionQuestionNavButton
                key={q.id}
                number={n}
                active={n === safeIndex}
                answered={Boolean(answersByQuestion[q.id])}
                flagged={isFlagged(q.id)}
                variant={variant}
                onClick={() => onSelectQuestion(n)}
              />
            )
          })}
        </div>
        <div className={ACTIVE_DRILL_FOOTER_NAV_ARROW_COLUMN_CLASS}>
          <span className={ACTIVE_DRILL_QUESTION_NAV_FLAG_SLOT_CLASS} aria-hidden />
          <PracticeSessionNavArrowButton
            direction="next"
            disabled={safeIndex >= questions.length}
            className={ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS}
            onClick={onNext}
          />
        </div>
      </div>
    </div>
  )
}

export { PracticeSessionActiveDrillFooterNav }
