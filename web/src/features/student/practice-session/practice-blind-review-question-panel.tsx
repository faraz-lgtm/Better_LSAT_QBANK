import { useState } from "react"

import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import type { DrillQuestion } from "@/features/student/drills/drill-types"
import {
  PracticeBlindReviewAnswerToggle,
  type BlindReviewAnswerView,
} from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import {
  BLIND_REVIEW_OPTIONS_LIST_CLASS,
  BLIND_REVIEW_QUESTION_NUMBER_CLASS,
  BLIND_REVIEW_QUESTION_STEM_CLASS,
  BLIND_REVIEW_RECOMMENDED_BADGE_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import type { PracticeToolMode } from "@/features/student/practice-session/practice-session-types"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"

type PracticeBlindReviewQuestionPanelProps = {
  question: DrillQuestion
  questionNumber: number
  findQuery: string
  selectedIndex: number | null
  revealed: boolean
  isCorrect: boolean | null
  submitting: boolean
  allowReselect: boolean
  getRegionHtml: (key: string, base: string) => string
  toolMode: PracticeToolMode
  onContentMouseUp: ReturnType<typeof usePracticeHighlights>["handleContentMouseUp"]
  onContentClick: ReturnType<typeof usePracticeHighlights>["handleContentClick"]
  onSelect: (index: number) => void
  answerView?: BlindReviewAnswerView
  onAnswerViewChange?: (view: BlindReviewAnswerView) => void
  recommendedForBr?: boolean
  choicesDisabled?: boolean
}

function regionKey(questionId: string, part: string) {
  return `${questionId}:${part}`
}

function PracticeBlindReviewQuestionPanel({
  question,
  questionNumber,
  findQuery,
  selectedIndex,
  revealed,
  isCorrect,
  submitting,
  allowReselect,
  getRegionHtml,
  toolMode,
  onContentMouseUp,
  onContentClick,
  onSelect,
  answerView = "blind_review",
  onAnswerViewChange,
  recommendedForBr = false,
  choicesDisabled = false,
}: PracticeBlindReviewQuestionPanelProps) {
  const [hiddenChoices, setHiddenChoices] = useState<Record<number, boolean>>({})
  const stemKey = regionKey(question.id, "stem")
  const stemHtml = getRegionHtml(stemKey, question.stemText ?? "")

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#e5e7eb] bg-[#f6f8fa] p-6">
        <div className="flex items-start gap-3">
          <span className={BLIND_REVIEW_QUESTION_NUMBER_CLASS}>{questionNumber}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              {recommendedForBr ? (
                <div className="inline-flex h-10 items-center rounded-[16px] bg-white p-1">
                  <span className={BLIND_REVIEW_RECOMMENDED_BADGE_CLASS}>Recommended for BR</span>
                </div>
              ) : (
                <span />
              )}
              {onAnswerViewChange ? (
                <PracticeBlindReviewAnswerToggle value={answerView} onChange={onAnswerViewChange} />
              ) : null}
            </div>
            <PracticeAnnotatedContent
              regionKey={stemKey}
              html={stemHtml}
              findQuery={findQuery}
              toolMode={toolMode}
              onMouseUp={onContentMouseUp}
              onClickCapture={onContentClick}
              className={BLIND_REVIEW_QUESTION_STEM_CLASS}
            />
          </div>
        </div>
      </div>
      {revealed && isCorrect != null ? (
        <p className="shrink-0 px-6 pt-4 text-xs font-semibold text-[#df1c41]">
          {isCorrect ? "Correct" : "Incorrect"}
        </p>
      ) : null}
      <div className="practice-session-scroll-hidden min-h-0 flex-1 overflow-y-auto">
        <div className={BLIND_REVIEW_OPTIONS_LIST_CLASS}>
          {question.choices.map((choice, index) => (
            <LrDrillOptionRow
              key={choice.id}
              index={index}
              html={getRegionHtml(regionKey(question.id, `choice-${choice.id}`), choice.text)}
              findQuery={findQuery}
              regionKey={regionKey(question.id, `choice-${choice.id}`)}
              selected={selectedIndex === index}
              hidden={Boolean(hiddenChoices[index])}
              disabled={submitting || choicesDisabled}
              selectedIndex={selectedIndex}
              allowReselect={allowReselect}
              onSelect={() => onSelect(index)}
              onToggleHidden={() =>
                setHiddenChoices((prev) => ({
                  ...prev,
                  [index]: !prev[index],
                }))
              }
              toolMode={toolMode}
              onContentMouseUp={onContentMouseUp}
              onContentClick={onContentClick}
              variant="blind-review"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export { PracticeBlindReviewQuestionPanel }
