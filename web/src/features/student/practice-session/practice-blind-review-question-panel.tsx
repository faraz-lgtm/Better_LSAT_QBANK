import { useEffect, useMemo, useState, type MouseEvent } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import type { DrillQuestion } from "@/features/student/drills/drill-types"
import {
  PracticeBlindReviewAnswerToggle,
  type BlindReviewAnswerOutcome,
  type BlindReviewAnswerView,
} from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import {
  BLIND_REVIEW_OPTIONS_LIST_CLASS,
  BLIND_REVIEW_QUESTION_NUMBER_CLASS,
  BLIND_REVIEW_QUESTION_STEM_CLASS,
  BLIND_REVIEW_QUESTION_STEM_WRAP_CLASS,
  BLIND_REVIEW_RECOMMENDED_BADGE_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import type {
  PracticeToolMode,
  RegionKey,
} from "@/features/student/practice-session/practice-session-types"
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
  /** Local / guest explanations when the explanations API has no row for this question. */
  seedStemExplanationHtml?: string | null
  seedQuestionTypeLabel?: string | null
  /** When false, hides question/answer explanation dropdowns (e.g. locked diagnostic). */
  explanationsEnabled?: boolean
  onAnnotateMouseUp?: (regionKey: RegionKey, container: HTMLElement | null, event?: MouseEvent) => void
  onAnnotateClick?: (regionKey: RegionKey, container: HTMLElement | null, event: MouseEvent) => void
  annotateToolMode?: PracticeToolMode
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
  seedStemExplanationHtml = null,
  seedQuestionTypeLabel = null,
  explanationsEnabled = true,
  onAnnotateMouseUp,
  onAnnotateClick,
  annotateToolMode = "none",
}: PracticeBlindReviewQuestionPanelProps) {
  const [hiddenChoices, setHiddenChoices] = useState<Record<number, boolean>>({})
  const [expandedChoiceIds, setExpandedChoiceIds] = useState<Set<string>>(() => new Set())
  const [stemExplanationOpen, setStemExplanationOpen] = useState(false)
  const [stemExplanationHtml, setStemExplanationHtml] = useState<string | null>(null)
  const [questionTypeLabel, setQuestionTypeLabel] = useState<string | null>(null)
  const [choiceExplanations, setChoiceExplanations] = useState<Record<string, string | null>>({})
  const [choicePopularityPct, setChoicePopularityPct] = useState<Record<string, number | null>>({})
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
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setExpandedChoiceIds(new Set())
      setStemExplanationOpen(false)
      setStemExplanationHtml(seedStemExplanationHtml?.trim() ? seedStemExplanationHtml : null)
      setQuestionTypeLabel(seedQuestionTypeLabel?.trim() ? seedQuestionTypeLabel : null)
      setChoiceExplanations({})
      setChoicePopularityPct({})
      setFetchedCorrectChoiceId(null)
    })
    return () => {
      cancelled = true
    }
  }, [question.choices, question.id, reviewChrome, seedStemExplanationHtml, seedQuestionTypeLabel])

  useEffect(() => {
    if (!reviewChrome || !explanationsApi) return
    let cancelled = false
    void explanationsApi
      .getExplanationDetail(question.id)
      .then((detail) => {
        if (cancelled) return
        const apiStem = detail.explanationHtml?.trim() ? detail.explanationHtml : null
        setStemExplanationHtml(apiStem ?? (seedStemExplanationHtml?.trim() ? seedStemExplanationHtml : null))
        const apiTopic = detail.topicName?.trim() ? detail.topicName : null
        setQuestionTypeLabel(apiTopic ?? (seedQuestionTypeLabel?.trim() ? seedQuestionTypeLabel : null))
        setFetchedCorrectChoiceId(detail.correctChoiceId)
        const next: Record<string, string | null> = {}
        for (const c of detail.choices) {
          next[c.id] = c.explanationHtml?.trim() ? c.explanationHtml : null
        }
        setChoiceExplanations(next)
        const popularity: Record<string, number | null> = {}
        for (const row of detail.answerPopularity) {
          popularity[row.letter.trim().toUpperCase()] = row.pct
        }
        setChoicePopularityPct(popularity)
      })
      .catch(() => {
        if (cancelled) return
        setStemExplanationHtml(seedStemExplanationHtml?.trim() ? seedStemExplanationHtml : null)
        setQuestionTypeLabel(seedQuestionTypeLabel?.trim() ? seedQuestionTypeLabel : null)
      })
    return () => {
      cancelled = true
    }
  }, [reviewChrome, explanationsApi, question.id, seedStemExplanationHtml, seedQuestionTypeLabel])

  const correctChoiceId = question.correctChoiceId ?? fetchedCorrectChoiceId
  const correctIndex =
    correctChoiceId != null ? question.choices.findIndex((c) => c.id === correctChoiceId) : -1

  const displaySelectedIndex =
    answerView === "clean"
      ? showCorrectAnswer && correctIndex >= 0
        ? correctIndex
        : null
      : selectedIndex

  const hasStemExplanation = Boolean(stemExplanationHtml?.trim())

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col",
        reviewChrome ? "practice-session-scroll-hidden overflow-y-auto" : "overflow-hidden",
      )}
    >
      <div className={cn("shrink-0", reviewChrome ? "bg-white" : "border-b border-[#e5e7eb] bg-[#f6f8fa] p-6")}>
        <div
          className={cn("flex gap-3", reviewChrome ? "flex-col items-stretch" : "items-start")}
        >
          {!reviewChrome ? (
            <span className={BLIND_REVIEW_QUESTION_NUMBER_CLASS}>{questionNumber}</span>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className={cn("flex flex-wrap items-center justify-between gap-3", reviewChrome && "mb-6")}>
              {reviewChrome ? (
                <PracticeBlindReviewAnswerToggle
                  value={answerView}
                  onChange={onAnswerViewChange ?? (() => {})}
                  variant="review"
                  actualOutcome={actualOutcome}
                  blindReviewOutcome={blindReviewOutcome}
                  blindReviewEnabled={blindReviewTabEnabled}
                  showOutcomeIcons={showCorrectAnswer}
                />
              ) : recommendedForBr ? (
                <div className="inline-flex h-10 items-center rounded-[16px] bg-white p-1">
                  <span className={BLIND_REVIEW_RECOMMENDED_BADGE_CLASS}>Recommended for BR</span>
                </div>
              ) : (
                <span />
              )}
              {reviewChrome ? (
                <label className="inline-flex h-8 shrink-0 items-center gap-3 whitespace-nowrap sm:gap-4">
                  <span className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#062357]">
                    Show Correct
                  </span>
                  <Switch
                    size="sm"
                    checked={showCorrectAnswer}
                    onChange={(e) => onShowCorrectAnswerChange?.(e.target.checked)}
                    aria-label="Show correct answer"
                  />
                </label>
              ) : onAnswerViewChange ? (
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
            <div
              className={cn(
                reviewChrome ? "flex items-start gap-3 px-6 py-3" : BLIND_REVIEW_QUESTION_STEM_WRAP_CLASS,
              )}
            >
              {reviewChrome ? (
                <span className="mt-[3px] shrink-0 text-base font-medium leading-[1.5] tracking-[0.32px] text-[#062357]">
                  {questionNumber}.
                </span>
              ) : null}
              <PracticeAnnotatedContent
                regionKey={stemKey}
                html={stemHtml}
                findQuery={findQuery}
                toolMode={reviewChrome ? "none" : annotateToolMode}
                onMouseUp={reviewChrome ? undefined : onAnnotateMouseUp}
                onClickCapture={reviewChrome ? undefined : onAnnotateClick}
                className={
                  reviewChrome
                    ? "min-w-0 flex-1 text-base font-medium leading-[1.5] tracking-[0.32px] text-[#062357]"
                    : BLIND_REVIEW_QUESTION_STEM_CLASS
                }
              />
              {reviewChrome && explanationsEnabled ? (
                <button
                  type="button"
                  className={cn(
                    "mt-1 inline-flex size-5 shrink-0 items-center justify-center transition",
                    stemExplanationOpen ? "text-[#0d47a1]" : "text-[#666d80] hover:text-[#062357]",
                  )}
                  aria-label={
                    stemExplanationOpen
                      ? "Hide passage explanation"
                      : "Show passage explanation"
                  }
                  aria-expanded={stemExplanationOpen}
                  onClick={() => setStemExplanationOpen((open) => !open)}
                >
                  {stemExplanationOpen ? (
                    <ChevronUp className="size-5" strokeWidth={2} aria-hidden />
                  ) : (
                    <ChevronDown className="size-5" strokeWidth={2} aria-hidden />
                  )}
                </button>
              ) : null}
            </div>
            {reviewChrome && explanationsEnabled && stemExplanationOpen ? (
              <div className="mb-6 mt-6 rounded-[14px] bg-[#f3f7ff] p-6 text-[#062357]">
                <p className="mb-6 text-base font-medium leading-[1.5] tracking-[0.32px]">
                  Question Type{questionTypeLabel ? ` - ${questionTypeLabel}` : ""}
                </p>
                <div className="text-sm font-normal leading-[1.5] tracking-[0.28px]">
                  {hasStemExplanation ? (
                    <HtmlContent
                      html={stemExplanationHtml ?? ""}
                      className="explanation-review-body text-[#062357]"
                    />
                  ) : (
                    <p className="m-0">
                      No question explanation available yet.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {revealed && isCorrect != null && !reviewChrome ? (
        <p className="shrink-0 px-6 pt-4 text-xs font-semibold text-[#df1c41]">
          {isCorrect ? "Correct" : "Incorrect"}
        </p>
      ) : null}
      <div className={cn(reviewChrome ? "flex shrink-0 flex-col gap-3 pb-6" : BLIND_REVIEW_OPTIONS_LIST_CLASS)}>
          {question.choices.map((choice, index) => {
            const isCorrectChoice = correctIndex === index
            const forceSelected =
              reviewChrome &&
              showCorrectAnswer &&
              answerView !== "clean" &&
              isCorrectChoice &&
              displaySelectedIndex !== index
            const isSelected = displaySelectedIndex === index || forceSelected
            const correctHighlight =
              reviewChrome && isCorrectChoice && (showCorrectAnswer || displaySelectedIndex === index)
            const explanationHtml =
              choiceExplanations[choice.id] ?? choice.explanationHtml ?? null

            return (
              <LrDrillOptionRow
                key={choice.id}
                index={index}
                html={getRegionHtml(regionKey(question.id, `choice-${choice.id}`), choice.text)}
                findQuery={findQuery}
                regionKey={regionKey(question.id, `choice-${choice.id}`)}
                selected={isSelected}
                correctHighlight={correctHighlight}
                hidden={Boolean(hiddenChoices[index])}
                disabled={submitting || choicesDisabled || (reviewChrome && !allowReselect)}
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
                explanationAction={reviewChrome && explanationsEnabled}
                explanationExpanded={explanationsEnabled && expandedChoiceIds.has(choice.id)}
                explanationHtml={explanationsEnabled ? explanationHtml : null}
                explanationPercent={choicePopularityPct[choice.id.trim().toUpperCase()] ?? null}
                onToggleExplanation={() =>
                  setExpandedChoiceIds((prev) => {
                    const next = new Set(prev)
                    if (next.has(choice.id)) next.delete(choice.id)
                    else next.add(choice.id)
                    return next
                  })
                }
              />
            )
          })}
      </div>
    </div>
  )
}

export { PracticeBlindReviewQuestionPanel }
