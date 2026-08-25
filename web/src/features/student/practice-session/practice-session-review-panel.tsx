import { useMemo, useState } from "react"
import { Check } from "lucide-react"

import {
  PRACTICE_SESSION_REVIEW_PANEL_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_CLOSE_BUTTON_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CHECKED_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_ITEM_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTERS_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_GRID_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_HEADER_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_TITLE_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ACTIVE_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ANSWERED_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_DEFAULT_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_FLAGGED_CLASS,
} from "@/features/student/practice-session/practice-session-review-panel-styles"
import { cn } from "@/lib/utils"

type ReviewFilterKey = "flagged" | "unattempted" | "partiallyAttempted"

type PracticeSessionReviewPanelProps = {
  open: boolean
  questions: ReadonlyArray<{ id: string }>
  currentIndex: number
  answersByQuestion: Readonly<Record<string, unknown>>
  isFlagged: (questionId: string) => boolean
  onSelectQuestion: (questionNumber: number) => void
  onClose: () => void
}

function matchesReviewFilters(input: {
  questionNumber: number
  questionId: string
  currentIndex: number
  answered: boolean
  flagged: boolean
  filters: Record<ReviewFilterKey, boolean>
}): boolean {
  const activeFilters = (Object.keys(input.filters) as ReviewFilterKey[]).filter((key) => input.filters[key])
  if (activeFilters.length === 0) return true

  const partiallyAttempted = !input.answered && input.questionNumber < input.currentIndex

  return activeFilters.some((filter) => {
    if (filter === "flagged") return input.flagged
    if (filter === "unattempted") return !input.answered
    return partiallyAttempted
  })
}

/** Figma `20268:103207` — review drawer opened from side widget */
function PracticeSessionReviewPanel({
  open,
  questions,
  currentIndex,
  answersByQuestion,
  isFlagged,
  onSelectQuestion,
  onClose,
}: PracticeSessionReviewPanelProps) {
  const [filters, setFilters] = useState<Record<ReviewFilterKey, boolean>>({
    flagged: false,
    unattempted: false,
    partiallyAttempted: false,
  })

  const visibleQuestions = useMemo(() => {
    return questions
      .map((question, offset) => {
        const questionNumber = offset + 1
        const answered = Boolean(answersByQuestion[question.id])
        const flagged = isFlagged(question.id)
        return {
          question,
          questionNumber,
          answered,
          flagged,
          visible: matchesReviewFilters({
            questionNumber,
            questionId: question.id,
            currentIndex,
            answered,
            flagged,
            filters,
          }),
        }
      })
      .filter((entry) => entry.visible)
  }, [answersByQuestion, currentIndex, filters, isFlagged, questions])

  if (!open) return null

  function toggleFilter(key: ReviewFilterKey) {
    setFilters((current) => ({ ...current, [key]: !current[key] }))
  }

  function handleSelectQuestion(questionNumber: number) {
    onSelectQuestion(questionNumber)
    onClose()
  }

  return (
    <section className={PRACTICE_SESSION_REVIEW_PANEL_CLASS} aria-label="Review questions">
      <div className={PRACTICE_SESSION_REVIEW_PANEL_HEADER_CLASS}>
        <h2 className={PRACTICE_SESSION_REVIEW_PANEL_TITLE_CLASS}>Review</h2>
        <button
          type="button"
          className={PRACTICE_SESSION_REVIEW_PANEL_CLOSE_BUTTON_CLASS}
          aria-label="Close review"
          onClick={onClose}
        >
          <span className="relative inline-flex size-6 shrink-0 overflow-clip" aria-hidden>
            <img
              src="/figma/exam-review/remove-rectangle.svg"
              alt=""
              width={24}
              height={24}
              className="size-full max-w-none object-contain"
              draggable={false}
            />
          </span>
        </button>
      </div>

      <div className={PRACTICE_SESSION_REVIEW_PANEL_FILTERS_CLASS}>
        {(
          [
            ["flagged", "Flagged"],
            ["unattempted", "Unattempted"],
          ] as const
        ).map(([key, label]) => {
          const checked = filters[key]
          return (
            <button
              key={key}
              type="button"
              className={PRACTICE_SESSION_REVIEW_PANEL_FILTER_ITEM_CLASS}
              aria-pressed={checked}
              onClick={() => toggleFilter(key)}
            >
              <span
                className={cn(
                  PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CLASS,
                  checked && PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CHECKED_CLASS,
                )}
                aria-hidden
              >
                {checked ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              {label}
            </button>
          )
        })}
      </div>

      <div className={PRACTICE_SESSION_REVIEW_PANEL_GRID_CLASS}>
        {visibleQuestions.map(({ question, questionNumber, answered, flagged }) => {
          const active = questionNumber === currentIndex
          return (
            <button
              key={question.id}
              type="button"
              className={cn(
                PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_CLASS,
                flagged && PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_FLAGGED_CLASS,
                active
                  ? PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ACTIVE_CLASS
                  : answered
                    ? PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ANSWERED_CLASS
                    : PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_DEFAULT_CLASS,
                answered && !active && "practice-session-review-panel__question-btn--answered",
              )}
              aria-current={active ? "true" : undefined}
              aria-label={
                flagged ? `Question ${questionNumber}, flagged` : `Question ${questionNumber}`
              }
              onClick={() => handleSelectQuestion(questionNumber)}
            >
              {flagged ? (
                <img
                  src="/figma/exam-review/flag.svg"
                  alt=""
                  width={11}
                  height={13}
                  className="h-[13px] w-[11px] max-w-none shrink-0"
                  draggable={false}
                />
              ) : null}
              <span>{questionNumber}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export { PracticeSessionReviewPanel, matchesReviewFilters }
