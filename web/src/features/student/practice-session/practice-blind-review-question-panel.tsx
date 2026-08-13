import { useEffect, useMemo, useState } from "react"

import { Switch } from "@/components/ui/switch"
import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import type { DrillQuestion } from "@/features/student/drills/drill-types"
import {
  PracticeBlindReviewAnswerToggle,
  type BlindReviewAnswerOutcome,
  type BlindReviewAnswerView,
} from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { ReviewIdeaIcon } from "@/features/student/practice-session/review-idea-icon"
import {
  BLIND_REVIEW_OPTIONS_LIST_CLASS,
  BLIND_REVIEW_QUESTION_NUMBER_CLASS,
  BLIND_REVIEW_QUESTION_STEM_CLASS,
  BLIND_REVIEW_RECOMMENDED_BADGE_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import { createExplanationsApi } from "@/lib/api/explanations"
import { HtmlContent } from "@/lib/html/html-content"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

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
  onSelect: (index: number) => void
  answerView?: BlindReviewAnswerView
  onAnswerViewChange?: (view: BlindReviewAnswerView) => void
  recommendedForBr?: boolean
  choicesDisabled?: boolean
  /** Figma `18617:33941` — Clean / Actual / Blind Review + Show Correct Answer */
  reviewChrome?: boolean
  actualOutcome?: BlindReviewAnswerOutcome
  blindReviewOutcome?: BlindReviewAnswerOutcome
  showCorrectAnswer?: boolean
  onShowCorrectAnswerChange?: (next: boolean) => void
  blindReviewTabEnabled?: boolean
}

function regionKey(questionId: string, part: string) {
  return `${questionId}:${part}`
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
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
  onSelect,
  answerView = "blind_review",
  onAnswerViewChange,
  recommendedForBr = false,
  choicesDisabled = false,
  reviewChrome = false,
  actualOutcome = null,
  blindReviewOutcome = null,
  showCorrectAnswer = false,
  onShowCorrectAnswerChange,
  blindReviewTabEnabled = true,
}: PracticeBlindReviewQuestionPanelProps) {
  const [hiddenChoices, setHiddenChoices] = useState<Record<number, boolean>>({})
  const [expandedChoiceId, setExpandedChoiceId] = useState<string | null>(null)
  const [stemExplanationOpen, setStemExplanationOpen] = useState(false)
  const [stemExplanationHtml, setStemExplanationHtml] = useState<string | null>(null)
  const [choiceExplanations, setChoiceExplanations] = useState<Record<string, string | null>>({})
  const [fetchedCorrectChoiceId, setFetchedCorrectChoiceId] = useState<string | null>(null)

  const stemKey = regionKey(question.id, "stem")
  const stemHtml = getRegionHtml(stemKey, question.stemText ?? "")

  const explanationsApi = useMemo(() => {
    if (!reviewChrome) return null
    try {
      return createExplanationsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [reviewChrome])

  useEffect(() => {
    setExpandedChoiceId(null)
    setStemExplanationOpen(false)
    setStemExplanationHtml(null)
    setChoiceExplanations({})
    setFetchedCorrectChoiceId(null)
  }, [question.id])

  useEffect(() => {
    if (!reviewChrome || !explanationsApi) return
    let cancelled = false
    void explanationsApi
      .getExplanationDetail(question.id)
      .then((detail) => {
        if (cancelled) return
        setStemExplanationHtml(detail.explanationHtml?.trim() ? detail.explanationHtml : null)
        setFetchedCorrectChoiceId(detail.correctChoiceId)
        const next: Record<string, string | null> = {}
        for (const c of detail.choices) {
          next[c.id] = c.explanationHtml?.trim() ? c.explanationHtml : null
        }
        setChoiceExplanations(next)
      })
      .catch(() => {
        if (cancelled) return
        setStemExplanationHtml(null)
      })
    return () => {
      cancelled = true
    }
  }, [reviewChrome, explanationsApi, question.id])

  const correctChoiceId = question.correctChoiceId ?? fetchedCorrectChoiceId
  const correctIndex =
    correctChoiceId != null ? question.choices.findIndex((c) => c.id === correctChoiceId) : -1

  const displaySelectedIndex =
    answerView === "clean"
      ? showCorrectAnswer && correctIndex >= 0
        ? correctIndex
        : null
      : selectedIndex

  const stemPlain = stripHtmlToText(question.stemText ?? "") || `Question ${questionNumber}`
  const hasStemExplanation = Boolean(stemExplanationHtml?.trim())

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#e5e7eb] bg-[#f6f8fa] p-6">
        <div
          className={cn("flex gap-3", reviewChrome ? "flex-col items-stretch" : "items-start")}
        >
          {!reviewChrome ? (
            <span className={BLIND_REVIEW_QUESTION_NUMBER_CLASS}>{questionNumber}</span>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              {reviewChrome ? (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex h-8 items-center rounded-[12px] bg-white px-3 text-sm font-medium tracking-[0.28px] text-[#062357]">
                    Question {questionNumber}
                  </span>
                  <span className="text-xs font-normal tracking-[0.24px] text-[#666d80]">
                    Show Correct Answer
                  </span>
                  <Switch
                    size="sm"
                    checked={showCorrectAnswer}
                    onChange={(e) => onShowCorrectAnswerChange?.(e.target.checked)}
                    aria-label="Show correct answer"
                  />
                </div>
              ) : recommendedForBr ? (
                <div className="inline-flex h-10 items-center rounded-[16px] bg-white p-1">
                  <span className={BLIND_REVIEW_RECOMMENDED_BADGE_CLASS}>Recommended for BR</span>
                </div>
              ) : (
                <span />
              )}
              {onAnswerViewChange ? (
                <PracticeBlindReviewAnswerToggle
                  value={answerView}
                  onChange={onAnswerViewChange}
                  variant={reviewChrome ? "review" : "blind-review"}
                  actualOutcome={actualOutcome}
                  blindReviewOutcome={blindReviewOutcome}
                  blindReviewEnabled={blindReviewTabEnabled}
                />
              ) : null}
            </div>
            <div className="flex items-start gap-3">
              <PracticeAnnotatedContent
                regionKey={stemKey}
                html={stemHtml}
                findQuery={findQuery}
                toolMode="none"
                className={cn(BLIND_REVIEW_QUESTION_STEM_CLASS, reviewChrome && "min-w-0 flex-1")}
              />
              {reviewChrome ? (
                <button
                  type="button"
                  className={cn(
                    "mt-1 inline-flex size-5 shrink-0 items-center justify-center transition",
                    stemExplanationOpen ? "text-[#0d47a1]" : "text-[#666d80] hover:text-[#062357]",
                    !hasStemExplanation && "opacity-40",
                  )}
                  aria-label={
                    hasStemExplanation
                      ? stemExplanationOpen
                        ? "Hide question explanation"
                        : "Show question explanation"
                      : "No question explanation"
                  }
                  aria-expanded={hasStemExplanation ? stemExplanationOpen : undefined}
                  disabled={!hasStemExplanation}
                  onClick={() => setStemExplanationOpen((open) => !open)}
                >
                  <ReviewIdeaIcon />
                </button>
              ) : null}
            </div>
            {reviewChrome && stemExplanationOpen && hasStemExplanation ? (
              <div className="overflow-hidden rounded-[14px] border border-[#0d47a1] bg-white">
                <div className="flex items-center justify-between gap-3 bg-[#0d47a1] px-3 py-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium tracking-[0.28px] text-white">
                    {stemPlain}
                  </p>
                  <ReviewIdeaIcon className="size-5 shrink-0 text-white" />
                </div>
                <div className="p-4">
                  <HtmlContent
                    html={stemExplanationHtml ?? ""}
                    className="explanation-option-body text-[#0d0d12]"
                  />
                </div>
              </div>
            ) : null}
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
          {question.choices.map((choice, index) => {
            const isCorrectChoice = correctIndex === index
            const forceSelected =
              reviewChrome &&
              showCorrectAnswer &&
              answerView !== "clean" &&
              isCorrectChoice &&
              displaySelectedIndex !== index
            const explanationHtml =
              choiceExplanations[choice.id] ?? choice.explanationHtml ?? null

            return (
              <LrDrillOptionRow
                key={choice.id}
                index={index}
                html={getRegionHtml(regionKey(question.id, `choice-${choice.id}`), choice.text)}
                findQuery={findQuery}
                regionKey={regionKey(question.id, `choice-${choice.id}`)}
                selected={displaySelectedIndex === index || forceSelected}
                hidden={Boolean(hiddenChoices[index])}
                disabled={submitting || choicesDisabled || reviewChrome}
                selectedIndex={displaySelectedIndex}
                allowReselect={allowReselect && !reviewChrome}
                onSelect={() => onSelect(index)}
                onToggleHidden={() =>
                  setHiddenChoices((prev) => ({
                    ...prev,
                    [index]: !prev[index],
                  }))
                }
                variant="blind-review"
                answerView={answerView}
                explanationAction={reviewChrome}
                explanationExpanded={expandedChoiceId === choice.id}
                explanationHtml={explanationHtml}
                onToggleExplanation={() =>
                  setExpandedChoiceId((prev) => (prev === choice.id ? null : choice.id))
                }
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { PracticeBlindReviewQuestionPanel }
