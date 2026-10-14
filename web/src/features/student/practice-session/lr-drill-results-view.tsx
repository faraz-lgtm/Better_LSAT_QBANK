import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Bookmark, Pencil, Trash2 } from "lucide-react"

import {
  FIGMA_DROPDOWN_CARD_OPEN_CLASS,
  FIGMA_DROPDOWN_PILL_FILTER_CLASS,
  FigmaDropdown,
} from "@/components/ui/figma-dropdown"
import { resolveAnswerPopularityRows } from "@/features/student/explanation-detail/answer-popularity-rows"
import { explanationQuestionDetailHref } from "@/features/student/explanation-detail/explanation-question-index"
import {
  filterPracticeResultQuestions,
  practiceResultQuestionBookmarkId,
} from "@/features/student/practice-session/filter-practice-result-questions"
import {
  PracticeResultsBookmarkedOnlyToggle,
  PracticeResultsEmptyFilterMessage,
} from "@/features/student/practice-session/practice-results-list-layout"
import {
  PT_RESULTS_HERO_CARD_CLASS,
  PT_RESULTS_PAGE_GAP_CLASS,
  PT_RESULTS_SURFACE_CARD_CLASS,
  PT_RESULTS_TAG_CLASS,
} from "@/features/student/analytics/prep-test-results-section-styles"
import type { PracticeQuestionResultMeta } from "@/features/student/practice-session/build-practice-results-section-groups"
import { useAccommodations } from "@/features/student/accommodations/accommodations-context"
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
  formatPaddedTargetTime,
  resolveQuestionResultTags,
  targetTimeSecondsForDifficulty,
} from "@/features/student/practice-session/practice-results-ui"
import { cn } from "@/lib/utils"
import { isFiniteTargetSeconds } from "@/lib/question-target-time"

const QUESTION_FILTER_OPTIONS = ["Both", "Correct", "Incorrect"] as const

type QuestionFilter = (typeof QUESTION_FILTER_OPTIONS)[number]

type LrDrillResultsViewProps = {
  questionCount: number
  rawScore: number
  scaledScore: number | null
  elapsedSeconds: number
  timing: string
  take: number
  questions: PracticeQuestionResultMeta[]
  showBlindReview: boolean
  bookmarkedIds: ReadonlySet<string>
  onToggleBookmark: (questionId: string) => void
  onReviewInTester: () => void
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
    <article className="flex w-[212px] shrink-0 flex-col gap-3 rounded-[16px] border border-[var(--greyscale-25)] bg-[var(--greyscale-0)] p-4">
      <div className="flex h-8 w-full items-center justify-between gap-1.5">
        <p className="text-xs font-semibold leading-[1.5] tracking-[0.24px] text-[var(--color-student-heading)]">{label}</p>
        <p className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">{scoreDelta}</p>
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
  "m-0 text-[11px] font-semibold leading-[1.5] tracking-[0.22px] text-[var(--greyscale-500)] @[680px]:text-sm @[680px]:tracking-[0.28px]"
const LR_RESULT_ACTION_CLASS =
  "flex size-7 shrink-0 items-center justify-center rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] text-[var(--greyscale-500)] transition-colors hover:bg-[var(--greyscale-0)] @[680px]:size-9 @[680px]:rounded-[12px]"

function DrillResultsQuestionRow({
  meta,
  showBlindReview,
  bookmarked,
  onToggleBookmark,
  first,
}: {
  meta: PracticeQuestionResultMeta
  showBlindReview: boolean
  bookmarked: boolean
  onToggleBookmark: (questionId: string) => void
  first: boolean
}) {
  const detail = meta.detail
  const title = detail
    ? formatLrDrillQuestionTitle(detail)
    : `Question ${meta.number}`
  const tags = detail ? resolveQuestionResultTags(detail) : []
  const difficulty = difficultyLabelFromLevel(detail?.difficulty ?? 3)
  const { scaleFactor } = useAccommodations()
  const baseTargetSec = isFiniteTargetSeconds(meta.question.targetTimeSeconds)
    ? meta.question.targetTimeSeconds
    : targetTimeSecondsForDifficulty(difficulty)
  const targetSec = Math.round(baseTargetSec * scaleFactor)
  const targetTime = formatPaddedTargetTime(targetSec)
  const recordedYour =
    typeof meta.yourTimeSeconds === "number" && Number.isFinite(meta.yourTimeSeconds) && meta.yourTimeSeconds >= 0
      ? meta.yourTimeSeconds
      : null
  const yourTime = recordedYour != null ? formatPaddedMmSs(recordedYour) : "—"
  const deltaSec = recordedYour != null ? targetSec - recordedYour : 0
  const yourTimeNote =
    recordedYour == null
      ? ""
      : deltaSec > 0
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
    : []
  const bookmarkId = practiceResultQuestionBookmarkId(meta)
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

  const actionButtons = (
    <div className="flex shrink-0 items-center justify-end gap-1.5 @[680px]:h-9 @[680px]:gap-4">
      {explanationHref ? (
        <Link to={explanationHref} className={LR_RESULT_ACTION_CLASS} aria-label="View explanation">
          <Pencil className="size-4 @[680px]:size-[18px]" aria-hidden />
        </Link>
      ) : (
        <button type="button" className={LR_RESULT_ACTION_CLASS} aria-label="Edit question" disabled>
          <Pencil className="size-4 @[680px]:size-[18px]" aria-hidden />
        </button>
      )}
      <button
        type="button"
        className={LR_RESULT_ACTION_CLASS}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
        aria-pressed={bookmarked}
        onClick={() => onToggleBookmark(bookmarkId)}
      >
        <Bookmark
          className={cn(
            "size-4 @[680px]:size-[18px]",
            bookmarked ? "fill-[var(--primary)] text-[var(--primary)]" : "text-[var(--greyscale-500)]",
          )}
          aria-hidden
        />
      </button>
    </div>
  )

  return (
    <article
      className={cn(
        "drill-result-question @container min-w-0 w-full max-w-full overflow-x-clip border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-3 @[680px]:p-6",
        first ? "rounded-t-[24px]" : "border-t-0",
      )}
    >
      <div className="flex w-full min-w-0 max-w-full items-start gap-3 @[680px]:gap-6">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[10px] @[680px]:size-14 @[680px]:rounded-[14px]",
            badgeClass,
          )}
        >
          <span className="text-base font-bold leading-[1.3] text-white @[680px]:text-2xl">{meta.number}</span>
        </div>

        <div className="grid min-w-0 max-w-full flex-1 grid-cols-1 items-start gap-2.5 @[680px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.25fr)_auto] @[680px]:gap-x-6 @[680px]:gap-y-4">
          <div className="flex min-w-0 items-start gap-1.5 @[680px]:contents">
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 @[680px]:gap-2">
              <h3 className="m-0 truncate text-sm font-bold leading-[1.35] text-[var(--color-student-heading)] @[680px]:overflow-visible @[680px]:text-xl @[680px]:whitespace-normal">
                {title}
              </h3>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1 @[680px]:gap-2.5">
                  {tags.map((tag) => (
                    <span key={tag} className={PT_RESULTS_TAG_CLASS}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="shrink-0 @[680px]:col-start-4 @[680px]:row-start-1 @[680px]:justify-self-end">
              {actionButtons}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1 @[680px]:gap-3">
            <p className={LR_RESULT_LABEL_CLASS}>Result</p>
            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 @[680px]:gap-x-5">
              <div className="flex h-6 min-w-0 items-center gap-1 @[680px]:h-7 @[680px]:gap-2.5">
                <PracticeResultOutcomeIcon
                  correct={meta.isCorrect}
                  unanswered={meta.isUnanswered}
                  variant="stroke"
                  className="size-4 shrink-0 @[680px]:size-6"
                />
                <span className="text-xs font-semibold leading-[1.5] tracking-[0.24px] text-[var(--color-student-heading)] @[680px]:text-base @[680px]:tracking-[0.32px]">
                  Actual
                </span>
              </div>
              {showBlindReview ? (
                <div className="flex min-w-0 items-center gap-1 @[680px]:gap-2.5">
                  <PracticeResultOutcomeIcon
                    correct={blindReviewCorrect}
                    unanswered={blindReviewUnanswered}
                    variant="stroke"
                    className="size-4 shrink-0 @[680px]:size-6"
                  />
                  <span className="text-xs font-semibold leading-[1.5] tracking-[0.24px] text-[var(--color-student-heading)] @[680px]:text-base @[680px]:tracking-[0.32px]">
                    Untimed Review
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="order-last min-w-0 @[680px]:order-none @[680px]:row-span-2">
            <PracticeAnswerPopularityBars
              rows={popularityRows}
              correctLetter={correctLetter}
              selectedLetter={selectedLetter}
              isUnanswered={meta.isUnanswered}
              showLabel
            />
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2 @[680px]:contents">
            <div className="flex min-w-0 flex-col gap-1 @[680px]:gap-3">
              <p className={LR_RESULT_LABEL_CLASS}>Timing</p>
              <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0">
                <span className="shrink-0 text-[10px] font-normal leading-[1.5] tracking-[0.2px] text-[var(--greyscale-500)] @[680px]:w-20 @[680px]:text-xs @[680px]:tracking-[0.24px]">
                  <span className="@[680px]:hidden">Target:</span>
                  <span className="hidden @[680px]:inline">Target time:</span>
                </span>
                <span className="text-[11px] font-semibold leading-[1.5] tracking-[0.22px] text-[var(--greyscale-500)] @[680px]:text-sm @[680px]:tracking-[0.28px]">
                  {targetTime}
                </span>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0">
                <span className="shrink-0 text-[10px] font-normal leading-[1.5] tracking-[0.2px] text-[var(--greyscale-500)] @[680px]:w-20 @[680px]:text-xs @[680px]:tracking-[0.24px]">
                  <span className="@[680px]:hidden">Yours:</span>
                  <span className="hidden @[680px]:inline">Your time:</span>
                </span>
                <span className="text-[11px] font-semibold leading-[1.5] tracking-[0.22px] text-[var(--primary)] @[680px]:text-sm @[680px]:tracking-[0.28px]">
                  {yourTime}
                </span>
                {yourTimeNote ? (
                  <span className="hidden text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)] @[680px]:inline">
                    {yourTimeNote}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1 @[680px]:gap-3">
              <p className={LR_RESULT_LABEL_CLASS}>Difficulty</p>
              <PracticeDifficultyMeter difficulty={difficulty} />
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
  questions,
  showBlindReview,
  bookmarkedIds,
  onToggleBookmark,
  onReviewInTester,
  variant = "drill",
  heroTitle: heroTitleOverride,
  compactLabel,
}: LrDrillResultsViewProps) {
  const { scaleFactor } = useAccommodations()
  const [filter, setFilter] = useState<QuestionFilter>("Both")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const isSection = variant === "section"
  const heroTitle =
    heroTitleOverride ?? formatLrDrillResultsTitle({ questionCount, timing, take, scaleFactor })
  const scoreHeadline = isSection
    ? scaledScore != null
      ? String(scaledScore)
      : `${rawScore}/${questionCount}`
    : formatAccuracyPct(rawScore, questionCount)
  const correctOnly = filter === "Correct"
  const incorrectOnly = filter === "Incorrect"
  const visibleQuestions = useMemo(
    () =>
      filterPracticeResultQuestions(questions, {
        correctOnly,
        incorrectOnly,
        bookmarkedOnly,
        bookmarkedIds,
      }),
    [bookmarkedIds, bookmarkedOnly, correctOnly, incorrectOnly, questions],
  )
  return (
    <div className={cn(PT_RESULTS_PAGE_GAP_CLASS, "min-w-0 max-w-full overflow-x-clip")}>
      <section className={PT_RESULTS_HERO_CARD_CLASS}>
        <div className="flex min-w-0 items-start justify-between gap-3 max-md:flex-col max-md:items-stretch sm:items-center">
          <h1 className="!m-0 min-w-0 !text-[24px] font-bold leading-[1.3] text-[var(--color-student-heading)] max-md:!text-[20px]">
            {heroTitle}
          </h1>
          <button
            type="button"
            onClick={onReviewInTester}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-[14px] bg-[#df1c41] px-4 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[color-mix(in_srgb,#df1c41_90%,black)] max-md:h-9 max-md:w-full"
          >
            Review in tester
          </button>
        </div>

        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex h-[199px] w-full shrink-0 flex-col justify-between rounded-[16px] bg-[var(--primary)] p-6 lg:w-[290px]">
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

          <div className="flex min-h-[199px] min-w-0 w-full flex-col gap-[18px] rounded-[16px] bg-[var(--greyscale-25)] p-6">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">RESULTS</p>
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
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            <p className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">
              {formatTotalQuestionsLabel(questionCount)}
            </p>
            <PracticeResultsBookmarkedOnlyToggle
              checked={bookmarkedOnly}
              onCheckedChange={setBookmarkedOnly}
            />
          </div>
          <FigmaDropdown
            variant="pill"
            value={filter}
            onChange={(next) => setFilter(next as QuestionFilter)}
            onOpenChange={setDropdownOpen}
            options={QUESTION_FILTER_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            className={FIGMA_DROPDOWN_PILL_FILTER_CLASS}
          />
        </div>
      </section>

      {visibleQuestions.length > 0 ? (
        <section className="min-w-0 overflow-hidden rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]">
          <div className="flex min-w-0 flex-col">
            {visibleQuestions.map((q, index) => (
              <DrillResultsQuestionRow
                key={q.question.id}
                meta={q}
                showBlindReview={showBlindReview}
                bookmarked={bookmarkedIds.has(practiceResultQuestionBookmarkId(q))}
                onToggleBookmark={onToggleBookmark}
                first={index === 0}
              />
            ))}
          </div>
        </section>
      ) : (
        <PracticeResultsEmptyFilterMessage
          bookmarkedOnly={bookmarkedOnly}
          incorrectOnly={incorrectOnly}
          correctOnly={correctOnly}
          scope={isSection ? "section" : "drill"}
        />
      )}

      <section className={cn(PT_RESULTS_SURFACE_CARD_CLASS, "flex flex-col gap-6 px-6 py-4")}>
        <p className="!m-0 !text-[24px] font-bold leading-[1.3] text-[var(--color-student-heading)]">About this PrepTest</p>

        <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
          {(
            [
              ["Questions", String(questionCount), "Timing", formatDrillAboutTiming(timing, elapsedSeconds, scaleFactor)],
              ["Time used", formatMinutesSecondsLabel(elapsedSeconds), "Take", formatTakeLabel(take)],
            ] as const
          ).map(([leftLabel, leftValue, rightLabel, rightValue]) => (
            <div key={leftLabel} className="contents">
              <div className="flex min-h-12 items-center justify-between gap-4 border-b border-[var(--greyscale-50)] py-3">
                <span className="text-base font-medium leading-[1.5] tracking-[0.02em] text-[var(--color-student-heading)]">
                  {leftLabel}
                </span>
                <span className="text-right text-base font-semibold leading-[1.5] tracking-[0.02em] text-[var(--color-student-heading)]">
                  {leftValue}
                </span>
              </div>
              <div className="flex min-h-12 items-center justify-between gap-4 border-b border-[var(--greyscale-50)] py-3">
                <span className="text-base font-medium leading-[1.5] tracking-[0.02em] text-[var(--color-student-heading)]">
                  {rightLabel}
                </span>
                <span className="text-right text-base font-semibold leading-[1.5] tracking-[0.02em] text-[var(--color-student-heading)]">
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
