import { Fragment, useMemo } from "react"

import {
  PracticeSessionQuestionNavButton,
  type PracticeSessionQuestionNavOutcome,
} from "@/features/student/practice-session/practice-session-question-nav-button"
import { passageBreakAfterIndices } from "@/features/student/practice-session/question-nav-passage-breaks"
import type { PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type NavQuestion = {
  id: string
  passage?: { id: string } | null
  sourceGroupId?: string | null
}

type PracticeSessionQuestionNavStripProps = {
  questions: ReadonlyArray<NavQuestion>
  safeIndex: number
  answersByQuestion: Readonly<Record<string, unknown>>
  isFlagged: (questionId: string) => boolean
  variant: PracticeSessionVariant
  onSelectQuestion: (questionNumber: number) => void
  recommendedForBr?: (questionId: string) => boolean
  /** When set, footer pills use Review outcome chrome (green / red / unanswered). */
  outcomeForQuestion?: (questionId: string) => PracticeSessionQuestionNavOutcome | null | undefined
  /** RC passage-group dividers. Off for LR — stimuli are one question each. */
  showPassageBreaks?: boolean
  className?: string
}

/** Vertical divider between RC passage question groups (LawHub-style). */
function passageBreakClass(variant: PracticeSessionVariant): string {
  if (variant === "active-drill") {
    return "practice-session-question-nav-passage-break h-7 w-[2px] min-w-[2px] shrink-0 self-end bg-[#9aa3b5]"
  }
  if (variant === "blind-review") {
    return "practice-session-question-nav-passage-break mt-4 h-8 w-[2px] min-w-[2px] shrink-0 self-start bg-[#9aa3b5]"
  }
  return "practice-session-question-nav-passage-break h-8 w-[2px] min-w-[2px] shrink-0 self-center bg-[#9aa3b5]"
}

function PracticeSessionQuestionNavStrip({
  questions,
  safeIndex,
  answersByQuestion,
  isFlagged,
  variant,
  onSelectQuestion,
  recommendedForBr,
  outcomeForQuestion,
  showPassageBreaks = true,
  className,
}: PracticeSessionQuestionNavStripProps) {
  const breakAfter = useMemo(
    () => (showPassageBreaks ? passageBreakAfterIndices(questions) : new Set<number>()),
    [questions, showPassageBreaks],
  )

  const isReviewNav = Boolean(className?.includes("practice-session-review-nav-row"))

  const items = questions.map((q, i) => {
    const n = i + 1
    return (
      <Fragment key={q.id}>
        <PracticeSessionQuestionNavButton
          number={n}
          active={n === safeIndex}
          answered={Boolean(answersByQuestion[q.id])}
          flagged={isFlagged(q.id)}
          recommendedForBr={recommendedForBr?.(q.id)}
          outcome={outcomeForQuestion?.(q.id) ?? null}
          variant={variant}
          onClick={() => onSelectQuestion(n)}
        />
        {breakAfter.has(i) ? (
          <span className={passageBreakClass(variant)} role="separator" aria-hidden />
        ) : null}
      </Fragment>
    )
  })

  if (isReviewNav) {
    return (
      <div
        className={cn(
          "practice-session-scroll-hidden min-h-[51px] min-w-0 flex-1 overflow-x-auto overflow-y-hidden",
          className
            ?.replace("practice-session-question-nav-grid", "")
            .replace("practice-session-review-nav-row", ""),
        )}
      >
        <div className="practice-session-question-nav-grid practice-session-review-nav-row">
          {items}
        </div>
      </div>
    )
  }

  return <div className={cn("practice-session-question-nav-grid", className)}>{items}</div>
}

export { PracticeSessionQuestionNavStrip }
