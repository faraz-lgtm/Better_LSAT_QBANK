import { useEffect, useMemo, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { PracticeSessionNavArrowButton } from "@/features/student/practice-session/practice-session-nav-arrow-button"
import {
  PRACTICE_SESSION_REVIEW_PAGE_BUTTON_ACTIVE_CLASS,
  PRACTICE_SESSION_REVIEW_PAGE_BUTTON_ANSWERED_CLASS,
  PRACTICE_SESSION_REVIEW_PAGE_BUTTON_CLASS,
  PRACTICE_SESSION_REVIEW_PAGE_BUTTON_DEFAULT_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_CLOSE_BUTTON_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CHECKED_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_ITEM_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTERS_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FOOTER_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FOOTER_CLUSTER_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FOOTER_PAGES_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_GRID_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_HEADER_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_TITLE_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ACTIVE_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ANSWERED_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_DEFAULT_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTIONS_PER_PAGE,
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

function getReviewPageCount(questionCount: number): number {
  return Math.max(1, Math.ceil(questionCount / PRACTICE_SESSION_REVIEW_QUESTIONS_PER_PAGE))
}

function getReviewPageForQuestion(questionNumber: number): number {
  return Math.floor((questionNumber - 1) / PRACTICE_SESSION_REVIEW_QUESTIONS_PER_PAGE)
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

/** Figma `18790:29610` — review drawer opened from side widget */
function PracticeSessionReviewPanel({
  open,
  questions,
  currentIndex,
  answersByQuestion,
  isFlagged,
  onSelectQuestion,
  onClose,
}: PracticeSessionReviewPanelProps) {
  const [pageIndex, setPageIndex] = useState(() => getReviewPageForQuestion(currentIndex))
  const [filters, setFilters] = useState<Record<ReviewFilterKey, boolean>>({
    flagged: false,
    unattempted: false,
    partiallyAttempted: false,
  })

  const pageCount = getReviewPageCount(questions.length)

  useEffect(() => {
    if (!open) return
    setPageIndex(getReviewPageForQuestion(currentIndex))
  }, [open, currentIndex])

  const pageQuestions = useMemo(() => {
    const start = pageIndex * PRACTICE_SESSION_REVIEW_QUESTIONS_PER_PAGE
    return questions.slice(start, start + PRACTICE_SESSION_REVIEW_QUESTIONS_PER_PAGE)
  }, [pageIndex, questions])

  const visibleQuestions = useMemo(() => {
    return pageQuestions
      .map((question, offset) => {
        const questionNumber = pageIndex * PRACTICE_SESSION_REVIEW_QUESTIONS_PER_PAGE + offset + 1
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
  }, [answersByQuestion, currentIndex, filters, isFlagged, pageIndex, pageQuestions])

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
          <ChevronDown className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className={PRACTICE_SESSION_REVIEW_PANEL_FILTERS_CLASS}>
        {(
          [
            ["flagged", "Flagged"],
            ["unattempted", "Unattempted"],
            ["partiallyAttempted", "Partially Attempted"],
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
        <div className="practice-session-question-nav-grid w-full">
          {visibleQuestions.map(({ question, questionNumber, answered, flagged }) => {
            const active = questionNumber === currentIndex
            return (
              <button
                key={question.id}
                type="button"
                className={cn(
                  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_CLASS,
                  active
                    ? PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ACTIVE_CLASS
                    : answered
                      ? PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ANSWERED_CLASS
                      : PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_DEFAULT_CLASS,
                )}
                aria-current={active ? "true" : undefined}
                aria-label={
                  flagged ? `Question ${questionNumber}, flagged` : `Question ${questionNumber}`
                }
                onClick={() => handleSelectQuestion(questionNumber)}
              >
                {questionNumber}
              </button>
            )
          })}
        </div>
      </div>

      {pageCount > 1 ? (
        <footer className={PRACTICE_SESSION_REVIEW_PANEL_FOOTER_CLASS}>
          <div className={PRACTICE_SESSION_REVIEW_PANEL_FOOTER_CLUSTER_CLASS}>
            <PracticeSessionNavArrowButton
              direction="prev"
              disabled={pageIndex <= 0}
              onClick={() => setPageIndex((page) => Math.max(0, page - 1))}
            />
            <div className={PRACTICE_SESSION_REVIEW_PANEL_FOOTER_PAGES_CLASS}>
              {Array.from({ length: pageCount }, (_, i) => {
                const pageNumber = i + 1
                const active = i === pageIndex
                const visited = i < pageIndex
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    className={cn(
                      PRACTICE_SESSION_REVIEW_PAGE_BUTTON_CLASS,
                      active
                        ? PRACTICE_SESSION_REVIEW_PAGE_BUTTON_ACTIVE_CLASS
                        : visited
                          ? PRACTICE_SESSION_REVIEW_PAGE_BUTTON_ANSWERED_CLASS
                          : PRACTICE_SESSION_REVIEW_PAGE_BUTTON_DEFAULT_CLASS,
                    )}
                    aria-current={active ? "true" : undefined}
                    aria-label={`Review page ${pageNumber}`}
                    onClick={() => setPageIndex(i)}
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>
            <PracticeSessionNavArrowButton
              direction="next"
              disabled={pageIndex >= pageCount - 1}
              onClick={() => setPageIndex((page) => Math.min(pageCount - 1, page + 1))}
            />
          </div>
        </footer>
      ) : null}
    </section>
  )
}

export { PracticeSessionReviewPanel, getReviewPageCount, matchesReviewFilters }
