import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Bookmark, Pencil, Trash2 } from "lucide-react"

import { FIGMA_DROPDOWN_CARD_OPEN_CLASS, FigmaDropdown } from "@/components/ui/figma-dropdown"
import { Switch } from "@/components/ui/switch"
import { resolveAnswerPopularityRows } from "@/features/student/explanation-detail/answer-popularity-rows"
import { explanationQuestionDetailHref } from "@/features/student/explanation-detail/explanation-question-index"
import {
  PT_RESULTS_HERO_CARD_CLASS,
  PT_RESULTS_PAGE_GAP_CLASS,
  PT_RESULTS_SURFACE_CARD_CLASS,
  PT_RESULTS_TAG_CLASS,
} from "@/features/student/analytics/prep-test-results-section-styles"
import type { PracticeQuestionResultMeta } from "@/features/student/practice-session/build-practice-results-section-groups"
import {
  formatAccuracyPct,
  formatCorrectSummaryLine,
  formatDrillAboutTiming,
  formatLrDrillQuestionTitle,
  formatLrDrillResultsTitle,
  formatMinutesSecondsLabel,
  formatPaddedMmSs,
  formatTakeLabel,
  formatTotalQuestionsLabel,
} from "@/features/student/practice-session/lr-drill-results-format"
import { PracticeResultOutcomeIcon } from "@/features/student/practice-session/practice-result-outcome-icon"
import {
  PracticeAnswerPopularityBars,
  PracticeDifficultyMeter,
  correctChoiceLetter,
  difficultyLabelFromLevel,
  resolveQuestionResultTags,
  targetTimeForDifficulty,
} from "@/features/student/practice-session/practice-results-ui"
import { cn } from "@/lib/utils"

const QUESTION_FILTER_OPTIONS = ["Question", "Incorrect only"] as const

type QuestionFilter = (typeof QUESTION_FILTER_OPTIONS)[number]

type LrDrillResultsViewProps = {
  questionCount: number
  rawScore: number
  scaledScore: number | null
  elapsedSeconds: number
  timing: string
  take: number
  excluded: boolean
  questions: PracticeQuestionResultMeta[]
  showBlindReview: boolean
  flaggedIds: Set<string>
  onReviewInTester: () => void
  onExcludedChange: (next: boolean) => void
  variant?: "drill" | "section"
  heroTitle?: string
  compactLabel?: string
}

function chunkOutcomes<T>(items: T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size))
  return rows
}

function LrDrillCompactResultsCard({
  questions,
  label = "Score",
}: {
  questions: PracticeQuestionResultMeta[]
  label?: string
}) {
  const missed = questions.filter((q) => q.isUnanswered || !q.isCorrect).length
  const scoreDelta = missed > 0 ? `-${missed}` : "0"
  const rows = chunkOutcomes(questions, 7)

  return (
    <article className="flex w-[212px] shrink-0 flex-col gap-3 rounded-[16px] border border-[#f6f8fa] bg-white p-4">
      <div className="flex h-8 w-full items-center justify-between gap-1.5">
        <p className="text-xs font-semibold leading-[1.5] tracking-[0.24px] text-[#062357]">{label}</p>
        <p className="text-2xl font-bold leading-[1.3] text-[#041a44]">{scoreDelta}</p>
      </div>
      <div className="flex flex-col gap-1">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap gap-1">
            {row.map((q) => (
              <PracticeResultOutcomeIcon
                key={q.question.id}
                correct={q.isCorrect}
                unanswered={q.isUnanswered}
                variant="grid"
              />
            ))}
          </div>
        ))}
      </div>
    </article>
  )
}

const LR_RESULT_LABEL_CLASS =
  "m-0 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#666d80]"
const LR_RESULT_ACTION_CLASS =
  "flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80] transition-colors hover:bg-white"

function DrillResultsQuestionRow({
  meta,
  showBlindReview,
  flagged,
  first,
}: {
  meta: PracticeQuestionResultMeta
  showBlindReview: boolean
  flagged: boolean
  first: boolean
}) {
  const detail = meta.detail
  const title = detail
    ? formatLrDrillQuestionTitle(detail)
    : `Question ${meta.number}`
  const tags = detail ? resolveQuestionResultTags(detail) : []
  const difficulty = difficultyLabelFromLevel(detail?.difficulty ?? 3)
  const targetTime = targetTimeForDifficulty(difficulty)
  const yourTime = formatPaddedMmSs(meta.yourTimeSeconds)
  const targetSec =
    difficulty === "Hardest" || difficulty === "Hard" ? 105 : difficulty === "Medium" ? 90 : 75
  const deltaSec = targetSec - meta.yourTimeSeconds
  const yourTimeNote =
    deltaSec > 0
      ? `(${formatPaddedMmSs(deltaSec)} under)`
      : deltaSec < 0
        ? `(${formatPaddedMmSs(-deltaSec)} over)`
        : ""
  const correctLetter = detail ? correctChoiceLetter(detail.choices, detail.correctChoiceId) : "A"
  const selectedLetter =
    detail && meta.selectedAnswer?.trim()
      ? correctChoiceLetter(detail.choices, meta.selectedAnswer)
      : null
  const popularityRows = detail
    ? resolveAnswerPopularityRows(
        detail.answerPopularity,
        detail.choices,
        detail.correctChoiceId ?? "",
      )
    : ["A", "B", "C", "D", "E"].map((letter) => ({ letter, count: 0, pct: 0 }))
  const explanationHref = detail ? explanationQuestionDetailHref(detail.questionId) : null
  const badgeClass = meta.isUnanswered
    ? "bg-[#ff6683]"
    : meta.isCorrect
      ? "bg-[#00d492]"
      : "bg-[#ef4444]"
  const blindReviewUnanswered = showBlindReview
    ? Boolean(meta.blindReviewUnanswered)
    : true
  const blindReviewCorrect = showBlindReview ? Boolean(meta.blindReviewCorrect) : false

  return (
    <article
      className={cn(
        "overflow-x-auto border border-[#dfe1e7] bg-white p-6",
        first ? "rounded-t-[24px]" : "border-t-0",
      )}
    >
      <div className="flex min-w-[1104px] items-start gap-6">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-[14px]",
            badgeClass,
          )}
        >
          <span className="text-2xl font-bold leading-[1.3] text-white">{meta.number}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex h-[60px] w-full items-center">
            <div className="flex h-full w-[562px] shrink-0 flex-col justify-center gap-2">
              <h3 className="m-0 whitespace-nowrap text-xl font-bold leading-[1.35] text-[#062357]">
                {title}
              </h3>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {tags.map((tag) => (
                    <span key={tag} className={PT_RESULTS_TAG_CLASS}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex h-full min-w-0 flex-1 flex-col justify-center gap-3">
              <p className={LR_RESULT_LABEL_CLASS}>Result</p>
              <div className="flex flex-nowrap items-center gap-5">
                <div className="flex h-7 shrink-0 items-center gap-2.5">
                  <PracticeResultOutcomeIcon
                    correct={meta.isCorrect}
                    unanswered={meta.isUnanswered}
                    variant="stroke"
                    className="size-6"
                  />
                  <span className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#062357]">
                    Actual
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <PracticeResultOutcomeIcon
                    correct={blindReviewCorrect}
                    unanswered={blindReviewUnanswered}
                    variant="stroke"
                    className="size-6"
                  />
                  <span className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#062357]">
                    Blind Review
                  </span>
                </div>
              </div>
            </div>

            <div className="flex h-9 w-[88px] shrink-0 items-center justify-end gap-4">
              {explanationHref ? (
                <Link to={explanationHref} className={LR_RESULT_ACTION_CLASS} aria-label="View explanation">
                  <Pencil className="size-[18px]" aria-hidden />
                </Link>
              ) : (
                <button type="button" className={LR_RESULT_ACTION_CLASS} aria-label="Edit question" disabled>
                  <Pencil className="size-[18px]" aria-hidden />
                </button>
              )}
              <button
                type="button"
                className={LR_RESULT_ACTION_CLASS}
                aria-label={flagged ? "Flagged" : "Bookmark question"}
                disabled
              >
                <Bookmark
                  className={cn("size-[18px]", flagged ? "fill-[#0d47a1] text-[#0d47a1]" : "")}
                  aria-hidden
                />
              </button>
            </div>
          </div>

          <div className="flex w-full items-start">
            <div className="flex h-[113px] w-[305px] shrink-0 flex-col gap-3">
              <p className={LR_RESULT_LABEL_CLASS}>Timing</p>
              <div className="flex gap-1">
                <span className="w-20 shrink-0 text-xs font-normal leading-[1.5] tracking-[0.24px] text-[#666d80]">
                  Target time:
                </span>
                <span className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#666d80]">
                  {targetTime}
                </span>
              </div>
              <div className="flex gap-1">
                <span className="w-20 shrink-0 text-xs font-normal leading-[1.5] tracking-[0.24px] text-[#666d80]">
                  Your time:
                </span>
                <span className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1]">
                  {yourTime}
                </span>
                {yourTimeNote ? (
                  <span className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#666d80]">
                    {yourTimeNote}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex h-[113px] w-[257px] shrink-0 flex-col gap-3">
              <p className={LR_RESULT_LABEL_CLASS}>Difficulty</p>
              <PracticeDifficultyMeter difficulty={difficulty} />
            </div>

            <div className="min-w-0 w-[542px] shrink-0">
              <PracticeAnswerPopularityBars
                rows={popularityRows}
                correctLetter={correctLetter}
                selectedLetter={selectedLetter}
                isUnanswered={meta.isUnanswered}
                showLabel
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function LrDrillResultsView({
  questionCount,
  rawScore,
  scaledScore,
  elapsedSeconds,
  timing,
  take,
  excluded,
  questions,
  showBlindReview,
  flaggedIds,
  onReviewInTester,
  onExcludedChange,
  variant = "drill",
  heroTitle: heroTitleOverride,
  compactLabel,
}: LrDrillResultsViewProps) {
  const [filter, setFilter] = useState<QuestionFilter>("Question")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const isSection = variant === "section"
  const heroTitle =
    heroTitleOverride ?? formatLrDrillResultsTitle({ questionCount, timing, take })
  const scoreHeadline = isSection
    ? scaledScore != null
      ? String(scaledScore)
      : `${rawScore}/${questionCount}`
    : formatAccuracyPct(rawScore, questionCount)
  const visibleQuestions = useMemo(
    () => (filter === "Incorrect only" ? questions.filter((q) => !q.isCorrect) : questions),
    [filter, questions],
  )

  return (
    <div className={PT_RESULTS_PAGE_GAP_CLASS}>
      <section className={PT_RESULTS_HERO_CARD_CLASS}>
        <div className="flex items-center justify-between gap-4">
          <h1 className="!m-0 !text-[24px] font-bold leading-[1.3] text-[#062357]">{heroTitle}</h1>
          <button
            type="button"
            onClick={onReviewInTester}
            className="inline-flex h-10 shrink-0 items-center rounded-[14px] bg-[#df1c41] px-4 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#df1c41]/90"
          >
            Review in tester
          </button>
        </div>

        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex h-[199px] w-full shrink-0 flex-col justify-between rounded-[16px] bg-[#0d47a1] p-6 lg:w-[290px]">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#edf3ff]">YOUR SCORE</p>
            <p className="text-[48px] font-extrabold leading-[1.2] text-white">
              {scoreHeadline}
            </p>
            <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
              {formatCorrectSummaryLine(rawScore, questionCount)}
            </p>
            <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
              {isSection ? "ACTUAL PT EQUIVALENT" : "Actual PT equivalent"} = {scaledScore ?? "—"}
            </p>
          </div>

          <div className="flex min-h-[199px] min-w-0 w-full flex-col gap-[18px] rounded-[16px] bg-[#f6f8fa] p-6">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#062357]">RESULTS</p>
            <div className="flex min-w-0 gap-[7px] overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <LrDrillCompactResultsCard
                questions={questions}
                label={compactLabel ?? "Score"}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        className={cn(
          PT_RESULTS_SURFACE_CARD_CLASS,
          "px-6 py-4",
          dropdownOpen && FIGMA_DROPDOWN_CARD_OPEN_CLASS,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-2xl font-bold leading-[1.3] text-[#062357]">
            {formatTotalQuestionsLabel(questionCount)}
          </p>
          <FigmaDropdown
            variant="pill"
            value={filter}
            onChange={(next) => setFilter(next as QuestionFilter)}
            onOpenChange={setDropdownOpen}
            options={QUESTION_FILTER_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            className="w-full min-w-[160px] max-w-[160px] sm:w-[160px]"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-[#dfe1e7] bg-white p-6">
        <div className="flex flex-col">
          {visibleQuestions.map((q, index) => (
            <DrillResultsQuestionRow
              key={q.question.id}
              meta={q}
              showBlindReview={showBlindReview}
              flagged={flaggedIds.has(q.question.id)}
              first={index === 0}
            />
          ))}
        </div>
      </section>

      <section className={cn(PT_RESULTS_SURFACE_CARD_CLASS, "flex flex-col gap-6 px-6 py-4")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="!m-0 !text-[24px] font-bold leading-[1.3] text-[#062357]">About this PrepTest</p>
          <div className="flex w-[212px] shrink-0 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="!text-[20px] font-bold leading-[1.35] text-[#062357]">Insights</span>
              <Switch
                checked={excluded}
                onChange={(event) => onExcludedChange(event.target.checked)}
                aria-label="Exclude this drill from insights"
                size="md"
              />
            </div>
            <p className="text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
              Exclude from Insights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
          {(
            [
              ["Questions", String(questionCount), "Timing", formatDrillAboutTiming(timing, elapsedSeconds)],
              ["Time used", formatMinutesSecondsLabel(elapsedSeconds), "Take", formatTakeLabel(take)],
            ] as const
          ).map(([leftLabel, leftValue, rightLabel, rightValue]) => (
            <div key={leftLabel} className="contents">
              <div className="flex min-h-12 items-center justify-between gap-4 border-b border-[#f1f5f9] py-3">
                <span className="text-base font-medium leading-[1.5] tracking-[0.02em] text-[#062357]">
                  {leftLabel}
                </span>
                <span className="text-right text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
                  {leftValue}
                </span>
              </div>
              <div className="flex min-h-12 items-center justify-between gap-4 border-b border-[#f1f5f9] py-3">
                <span className="text-base font-medium leading-[1.5] tracking-[0.02em] text-[#062357]">
                  {rightLabel}
                </span>
                <span className="text-right text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
                  {rightValue}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="flex items-center gap-2.5 self-start text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[#df1c41] transition-opacity hover:opacity-80"
        >
          <Trash2 className="size-5 shrink-0" aria-hidden />
          Delete PrepTest
        </button>
      </section>
    </div>
  )
}

export { DrillResultsQuestionRow, LrDrillCompactResultsCard, LrDrillResultsView }
export type { LrDrillResultsViewProps }
