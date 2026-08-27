import { Fragment, useMemo, useState } from "react"
import { Check } from "lucide-react"

import {
  OFFICIAL_REVIEW_ANSWERED_BAR_CLASS,
  OFFICIAL_REVIEW_CLOSE_BUTTON_CLASS,
  OFFICIAL_REVIEW_CURRENT_BAR_CLASS,
  OFFICIAL_REVIEW_CURRENT_CARET_CLASS,
  OFFICIAL_REVIEW_FILTER_BOX_CHECKED_CLASS,
  OFFICIAL_REVIEW_FILTER_BOX_CLASS,
  OFFICIAL_REVIEW_FILTER_ITEM_CLASS,
  OFFICIAL_REVIEW_FILTERS_CLASS,
  OFFICIAL_REVIEW_FINISH_BUTTON_CLASS,
  OFFICIAL_REVIEW_FINISH_WRAP_CLASS,
  OFFICIAL_REVIEW_GRID_CLASS,
  OFFICIAL_REVIEW_GRID_WRAP_CLASS,
  OFFICIAL_REVIEW_HEADER_CLASS,
  OFFICIAL_REVIEW_PANEL_CLASS,
  OFFICIAL_REVIEW_PASSAGE_BREAK_CLASS,
  OFFICIAL_REVIEW_QUESTION_BUTTON_CLASS,
  OFFICIAL_REVIEW_TITLE_CLASS,
} from "@/features/student/practice-session/practice-session-official-styles"
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
import { officialReviewSpacerBeforeIndices, type QuestionWithPassage } from "@/features/student/practice-session/question-nav-passage-breaks"
import { isOfficialLayout, type PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type ReviewFilterKey = "flagged" | "unattempted" | "partiallyAttempted"

type ReviewQuestion = QuestionWithPassage & { id: string }

type PracticeSessionReviewPanelProps = {
  open: boolean
  questions: ReadonlyArray<ReviewQuestion>
  currentIndex: number
  answersByQuestion: Readonly<Record<string, unknown>>
  isFlagged: (questionId: string) => boolean
  onSelectQuestion: (questionNumber: number) => void
  onClose: () => void
  variant?: PracticeSessionVariant
  onFinish?: () => void
  showPassageBreaks?: boolean
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

/** Figma `20268:103207` LSAT drawer; official overlay is Figma `20257:89990`. */
function PracticeSessionReviewPanel({
  open,
  questions,
  currentIndex,
  answersByQuestion,
  isFlagged,
  onSelectQuestion,
  onClose,
  variant = "default",
  onFinish,
  showPassageBreaks = false,
}: PracticeSessionReviewPanelProps) {
  const [filters, setFilters] = useState<Record<ReviewFilterKey, boolean>>({
    flagged: false,
    unattempted: false,
    partiallyAttempted: false,
  })
  const officialChrome = isOfficialLayout(variant)
  const filtersActive = filters.flagged || filters.unattempted || filters.partiallyAttempted

  const spacerBefore = useMemo(
    () => (showPassageBreaks ? officialReviewSpacerBeforeIndices(questions) : new Set<number>()),
    [questions, showPassageBreaks],
  )

  const visibleQuestions = useMemo(() => {
    return questions
      .map((question, offset) => {
        const questionNumber = offset + 1
        const answered = Boolean(answersByQuestion[question.id])
        const flagged = isFlagged(question.id)
        return {
          question,
          questionNumber,
          offset,
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

  const filterButtons = (
    (
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
          className={officialChrome ? OFFICIAL_REVIEW_FILTER_ITEM_CLASS : PRACTICE_SESSION_REVIEW_PANEL_FILTER_ITEM_CLASS}
          aria-pressed={checked}
          onClick={() => toggleFilter(key)}
        >
          <span
            className={cn(
              officialChrome ? OFFICIAL_REVIEW_FILTER_BOX_CLASS : PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CLASS,
              checked && (officialChrome ? OFFICIAL_REVIEW_FILTER_BOX_CHECKED_CLASS : PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CHECKED_CLASS),
            )}
            aria-hidden
          >
            {checked ? <Check className="size-3" strokeWidth={3} /> : null}
          </span>
          {label}
        </button>
      )
    })
  )

  if (officialChrome) {
    return (
      <section className={OFFICIAL_REVIEW_PANEL_CLASS} aria-label="Review questions">
        <div className={OFFICIAL_REVIEW_HEADER_CLASS}>
          <h2 className={OFFICIAL_REVIEW_TITLE_CLASS}>Review</h2>
          <button type="button" className={OFFICIAL_REVIEW_CLOSE_BUTTON_CLASS} aria-label="Close review" onClick={onClose}>
            <span className="relative inline-flex h-[14px] w-[11px] shrink-0 overflow-clip" aria-hidden>
              <img
                src="/figma/exam-official/review-close.svg"
                alt=""
                width={11}
                height={14}
                className="size-full max-w-none object-contain"
                draggable={false}
              />
            </span>
          </button>
        </div>

        <div className={OFFICIAL_REVIEW_FILTERS_CLASS}>{filterButtons}</div>

        <div className={OFFICIAL_REVIEW_GRID_WRAP_CLASS}>
          <div className={cn(OFFICIAL_REVIEW_GRID_CLASS, "grid-cols-12")}>
            {visibleQuestions.map(({ question, questionNumber, offset, answered, flagged }) => {
              const active = questionNumber === currentIndex
              return (
                <Fragment key={question.id}>
                  {!filtersActive && spacerBefore.has(offset) ? (
                    <div className={OFFICIAL_REVIEW_PASSAGE_BREAK_CLASS} role="separator" aria-hidden />
                  ) : null}
                  <button
                    type="button"
                    className={OFFICIAL_REVIEW_QUESTION_BUTTON_CLASS}
                    aria-current={active ? "true" : undefined}
                    aria-label={flagged ? `Question ${questionNumber}, flagged` : `Question ${questionNumber}`}
                    onClick={() => handleSelectQuestion(questionNumber)}
                  >
                    {flagged ? (
                      <img
                        src="/figma/exam-official/review-flag.svg"
                        alt=""
                        width={16}
                        height={18}
                        className="h-[18px] w-4 max-w-none shrink-0"
                        draggable={false}
                      />
                    ) : (
                      <span>{questionNumber}</span>
                    )}
                    {active ? (
                      <>
                        <img
                          src="/figma/exam-official/current-caret.svg"
                          alt=""
                          width={12}
                          height={6}
                          className={OFFICIAL_REVIEW_CURRENT_CARET_CLASS}
                          draggable={false}
                        />
                        <span className={OFFICIAL_REVIEW_CURRENT_BAR_CLASS} aria-hidden />
                      </>
                    ) : answered ? (
                      <span className={OFFICIAL_REVIEW_ANSWERED_BAR_CLASS} aria-hidden />
                    ) : null}
                  </button>
                </Fragment>
              )
            })}
          </div>
        </div>

        {onFinish ? (
          <div className={OFFICIAL_REVIEW_FINISH_WRAP_CLASS}>
            <button type="button" className={OFFICIAL_REVIEW_FINISH_BUTTON_CLASS} onClick={onFinish}>
              Finish
            </button>
          </div>
        ) : null}
      </section>
    )
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

      <div className={PRACTICE_SESSION_REVIEW_PANEL_FILTERS_CLASS}>{filterButtons}</div>

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
              aria-label={flagged ? `Question ${questionNumber}, flagged` : `Question ${questionNumber}`}
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
