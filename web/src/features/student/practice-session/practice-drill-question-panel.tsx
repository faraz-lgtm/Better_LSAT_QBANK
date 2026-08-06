import { useState } from "react"

import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import type { DrillQuestion } from "@/features/student/drills/drill-types"
import {
  ACTIVE_DRILL_OPTIONS_LIST_CLASS,
  ACTIVE_DRILL_QUESTION_PANEL_WITH_WIDGET_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import {
  PracticeBlindReviewAnswerToggle,
  type BlindReviewAnswerView,
} from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import { PracticeBlindReviewQuestionPanel } from "@/features/student/practice-session/practice-blind-review-question-panel"
import { PracticeQuestionStem } from "@/features/student/practice-session/practice-question-stem"
import { PracticeSessionResetResponseButton } from "@/features/student/practice-session/practice-session-reset-response-button"
import { PracticeSessionSideWidget } from "@/features/student/practice-session/practice-session-side-action-rail"
import { useResponseMasking } from "@/features/student/practice-session/use-response-masking"
import type { PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

function regionKey(questionId: string, part: string) {
  return `${questionId}:${part}`
}

type PracticeDrillQuestionPanelProps = {
  question: DrillQuestion
  questionNumber: number
  findQuery: string
  selectedIndex: number | null
  revealed: boolean
  isCorrect: boolean | null
  submitting: boolean
  allowReselect: boolean
  getRegionHtml: (key: string, base: string) => string
  onSelect: (index: number) => void
  flagged: boolean
  onToggleFlag: () => void
  onOpenReview?: () => void
  onOpenAccessibility?: () => void
  flagsDisabled?: boolean
  variant?: PracticeSessionVariant
  blindReviewChrome?: boolean
  answerView?: BlindReviewAnswerView
  onAnswerViewChange?: (view: BlindReviewAnswerView) => void
  recommendedForBr?: boolean
  choicesDisabled?: boolean
}

function PracticeDrillQuestionPanel({
  question,
  questionNumber,
  findQuery,
  selectedIndex,
  revealed,
  isCorrect,
  submitting,
  allowReselect,
  getRegionHtml,
  onSelect,
  flagged,
  onToggleFlag,
  onOpenReview,
  onOpenAccessibility,
  flagsDisabled,
  variant,
  blindReviewChrome = false,
  answerView = "blind_review",
  onAnswerViewChange,
  recommendedForBr = false,
  choicesDisabled = false,
}: PracticeDrillQuestionPanelProps) {
  const [hiddenChoices, setHiddenChoices] = useState<Record<number, boolean>>({})
  const {
    responseMasking,
    maskedChoices,
    hasMaskedChoices,
    toggleResponseMasking,
    toggleChoiceMask,
    resetMaskedChoices,
  } = useResponseMasking()
  const stemKey = regionKey(question.id, "stem")
  const stemHtml = getRegionHtml(stemKey, question.stemText ?? "")
  const isBlindReviewLayout = blindReviewChrome && variant === "blind-review"
  const isActiveDrillLayout = variant === "active-drill"

  if (isBlindReviewLayout) {
    return (
      <PracticeBlindReviewQuestionPanel
        question={question}
        questionNumber={questionNumber}
        findQuery={findQuery}
        selectedIndex={selectedIndex}
        revealed={revealed}
        isCorrect={isCorrect}
        submitting={submitting}
        allowReselect={allowReselect}
        getRegionHtml={getRegionHtml}
        onSelect={onSelect}
        answerView={answerView}
        onAnswerViewChange={onAnswerViewChange}
        recommendedForBr={recommendedForBr}
        choicesDisabled={choicesDisabled}
      />
    )
  }

  return (
    <>
      {blindReviewChrome ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3",
            variant === "active-drill" ? "px-4 pt-4" : "",
          )}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-[#ff9d51] bg-white text-sm font-bold text-[#ff9d51]">
              {questionNumber}
            </span>
            {recommendedForBr ? (
              <span className="inline-flex rounded-full border border-[#ff9d51] bg-[#fff3ea] px-3 py-1 text-xs font-semibold text-[#c45a00]">
                Recommended for BR
              </span>
            ) : null}
          </div>
          {onAnswerViewChange ? (
            <PracticeBlindReviewAnswerToggle value={answerView} onChange={onAnswerViewChange} />
          ) : null}
        </div>
      ) : null}
      <div className={cn(isActiveDrillLayout && ACTIVE_DRILL_QUESTION_PANEL_WITH_WIDGET_CLASS)}>
        <PracticeQuestionStem
          questionNumber={questionNumber}
          regionKey={stemKey}
          html={stemHtml}
          findQuery={findQuery}
          flagged={flagged}
          onToggleFlag={onToggleFlag}
          flagsDisabled={flagsDisabled}
          variant={variant}
          hideQuestionNumber={blindReviewChrome || isActiveDrillLayout}
          showSideFlag={!isActiveDrillLayout}
        />
        {revealed && isCorrect != null ? (
          <p
            className="text-xs font-semibold"
            style={{ color: isCorrect ? "var(--color-student-accent)" : "#df1c41" }}
          >
            {isCorrect ? "Correct" : "Incorrect"}
          </p>
        ) : null}
        <div className={isActiveDrillLayout ? ACTIVE_DRILL_OPTIONS_LIST_CLASS : "flex flex-col gap-2"}>
          {question.choices.map((choice, index) => (
            <LrDrillOptionRow
              key={choice.id}
              index={index}
              html={getRegionHtml(regionKey(question.id, `choice-${choice.id}`), choice.text)}
              findQuery={findQuery}
              regionKey={regionKey(question.id, `choice-${choice.id}`)}
              selected={selectedIndex === index}
              hidden={!isActiveDrillLayout && Boolean(hiddenChoices[index])}
              masked={isActiveDrillLayout ? Boolean(maskedChoices[index]) : false}
              maskingMode={isActiveDrillLayout && responseMasking}
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
              onToggleMasked={() => toggleChoiceMask(index)}
              variant={variant}
              showSideAction={!isActiveDrillLayout}
            />
          ))}
          {isActiveDrillLayout && (responseMasking || hasMaskedChoices) ? (
            <PracticeSessionResetResponseButton onClick={resetMaskedChoices} />
          ) : null}
        </div>
        {isActiveDrillLayout ? (
          <PracticeSessionSideWidget
            flagged={flagged}
            onToggleFlag={onToggleFlag}
            flagsDisabled={flagsDisabled}
            responseMasking={responseMasking}
            onToggleResponseMasking={toggleResponseMasking}
            onReview={onOpenReview}
            onAccessibility={onOpenAccessibility}
          />
        ) : null}
      </div>
    </>
  )
}

export { PracticeDrillQuestionPanel, regionKey }
