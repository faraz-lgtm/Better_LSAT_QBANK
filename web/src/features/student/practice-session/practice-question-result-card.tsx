import { ActiveDrillOutcomeIcon } from "@/features/prep-course/components/active-drill/active-drill-outcome-icon"
import { Bookmark, Pencil } from "lucide-react"

import { resolveAnswerPopularityRows } from "@/features/student/explanation-detail/answer-popularity-rows"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { useAccommodations } from "@/features/student/accommodations/accommodations-context"
import { PracticeResultOutcomeIcon } from "@/features/student/practice-session/practice-result-outcome-icon"
import {
  PracticeQuestionResultCardLayout,
  PracticeQuestionResultStatsRow,
  correctChoiceLetter,
  difficultyLabelFromLevel,
  formatMmSs,
  formatPaddedTargetTime,
  formatPtQuestionTitle,
  resolveQuestionResultTags,
  targetTimeSecondsForDifficulty,
} from "@/features/student/practice-session/practice-results-ui"
import { cn } from "@/lib/utils"
import { isFiniteTargetSeconds } from "@/lib/question-target-time"

type PracticeQuestionResultCardProps = {
  number: number
  detail: ExplanationDetailPayload | null
  titleOverride?: string
  isCorrect: boolean
  isUnanswered?: boolean
  selectedAnswer?: string | null
  blindReviewCorrect?: boolean
  blindReviewUnanswered?: boolean
  showBlindReview?: boolean
  yourTimeSeconds?: number | null
  bookmarked?: boolean
  onToggleBookmark?: (questionId: string) => void
  flagged?: boolean
  variant?: "default" | "active-drill" | "in-section"
  className?: string
  targetTimeSeconds?: number | null
}

function questionResultBadgeClass(isUnanswered: boolean, isCorrect: boolean) {
  if (isUnanswered) return "bg-[#ff6683]"
  if (isCorrect) return "bg-[#00d492]"
  return "bg-[#ef4444]"
}

function PracticeQuestionResultCard({
  number,
  detail,
  titleOverride,
  isCorrect,
  isUnanswered = false,
  selectedAnswer = null,
  blindReviewCorrect,
  blindReviewUnanswered = false,
  showBlindReview = false,
  yourTimeSeconds,
  bookmarked,
  onToggleBookmark,
  flagged,
  variant = "default",
  className,
  targetTimeSeconds,
}: PracticeQuestionResultCardProps) {
  const { scaleFactor } = useAccommodations()
  const isActiveDrill = variant === "active-drill"
  const showBlindReviewResult = showBlindReview
  const title = titleOverride ?? (detail ? formatPtQuestionTitle(detail) : `Question ${number}`)
  const tags = detail ? resolveQuestionResultTags(detail) : []
  const difficulty = difficultyLabelFromLevel(detail?.difficulty ?? 3)
  const baseTargetSec = isFiniteTargetSeconds(targetTimeSeconds)
    ? targetTimeSeconds
    : targetTimeSecondsForDifficulty(difficulty)
  const targetSec = Math.round(baseTargetSec * scaleFactor)
  const targetTime = formatPaddedTargetTime(targetSec)
  const formatElapsed = isActiveDrill ? formatPaddedTargetTime : formatMmSs
  const yourTime =
    yourTimeSeconds != null && yourTimeSeconds >= 0 ? formatElapsed(yourTimeSeconds) : "—"
  const yourSec = yourTimeSeconds ?? 0
  const deltaSec = targetSec - yourSec
  const yourTimeNote =
    yourTimeSeconds != null && deltaSec > 0
      ? `(${formatElapsed(deltaSec)} under)`
      : yourTimeSeconds != null && deltaSec < 0
        ? `(${formatElapsed(-deltaSec)} over)`
        : ""

  const correctLetter = detail
    ? correctChoiceLetter(detail.choices, detail.correctChoiceId)
    : "A"
  const selectedLetter =
    detail && selectedAnswer?.trim()
      ? correctChoiceLetter(detail.choices, selectedAnswer)
      : null
  const popularityRows = detail
    ? resolveAnswerPopularityRows(
        detail.answerPopularity,
        detail.choices,
        detail.correctChoiceId ?? "",
      )
    : []

  const explanationHref = detail
    ? `/app/learn/explanations/q/${encodeURIComponent(detail.questionId)}`
    : null
  const bookmarkId = detail?.questionId
  const isBookmarked = bookmarked ?? flagged ?? false
  const canToggleBookmark = Boolean(onToggleBookmark && bookmarkId)

  const pencilIcon = isActiveDrill ? (
    <img src="/figma/active-drill/pencil.svg" alt="" width={18} height={18} className="size-[18px]" />
  ) : (
    <Pencil className="size-[18px]" aria-hidden />
  )
  const bookmarkIcon = (
    <Bookmark
      className={cn(
        "size-[18px]",
        isBookmarked ? "fill-[var(--primary)] text-[var(--primary)]" : "text-[var(--greyscale-500)]",
      )}
      aria-hidden
    />
  )

  const actionButtons = (
    <div className="flex shrink-0 gap-4">
      {explanationHref ? (
        <a
          href={explanationHref}
          className="flex size-9 items-center justify-center rounded-xl border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] text-[var(--greyscale-500)] transition-colors hover:bg-[var(--greyscale-0)]"
          aria-label="View explanation"
        >
          {pencilIcon}
        </a>
      ) : (
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-xl border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] text-[var(--greyscale-500)]"
          aria-label="Edit question"
          disabled
        >
          {pencilIcon}
        </button>
      )}
      {isActiveDrill ? null : (
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-xl border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] text-[var(--greyscale-500)]"
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark question"}
          aria-pressed={isBookmarked}
          disabled={!canToggleBookmark}
          onClick={() => {
            if (!canToggleBookmark || !bookmarkId || !onToggleBookmark) return
            onToggleBookmark(bookmarkId)
          }}
        >
          {bookmarkIcon}
        </button>
      )}
    </div>
  )

  const resultRow = (iconVariant: "stroke" | "filled") => (
    <div className="flex flex-nowrap items-center gap-5">
      <div className="flex h-7 shrink-0 items-center gap-2.5">
        <PracticeResultOutcomeIcon
          correct={isCorrect}
          unanswered={isUnanswered}
          variant={iconVariant}
          className={iconVariant === "stroke" ? "size-6" : undefined}
        />
        <span className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[var(--color-student-heading)]">Actual</span>
      </div>
      {showBlindReviewResult ? (
        <div className="flex shrink-0 items-center gap-2.5">
          <PracticeResultOutcomeIcon
            correct={Boolean(blindReviewCorrect)}
            unanswered={blindReviewUnanswered}
            variant={iconVariant}
            className={iconVariant === "stroke" ? "size-6" : undefined}
          />
          <span className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[var(--color-student-heading)]">
            Untimed Review
          </span>
        </div>
      ) : null}
    </div>
  )

  const resolvedPopularityRows = popularityRows

  const questionCardBody = (
    <PracticeQuestionResultCardLayout
      title={title}
      tags={tags}
      resultContent={resultRow("stroke")}
      actions={actionButtons}
      targetTime={targetTime}
      yourTime={yourTime}
      yourTimeNote={yourTimeNote}
      difficulty={difficulty}
      popularityRows={resolvedPopularityRows}
      correctLetter={correctLetter}
      selectedLetter={selectedLetter}
      isUnanswered={isUnanswered}
    />
  )

  if (variant === "in-section") {
    return (
      <article
        className={cn(
          "border-t border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6",
          className,
        )}
      >
        <div className="flex items-start gap-6">
          <div
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-[14px]",
              questionResultBadgeClass(isUnanswered, isCorrect),
            )}
          >
            <span className="text-2xl font-bold leading-[1.3] text-white">{number}</span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {questionCardBody}
          </div>
        </div>
      </article>
    )
  }

  if (variant === "active-drill") {
    return (
      <article
        className={cn(
          "relative min-w-0 max-w-full overflow-hidden rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6 shadow-[0px_1px_1px_rgba(13,13,18,0.04)]",
          className,
        )}
      >
        <div className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)] items-start gap-x-6 gap-y-2">
          <div
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-[14px]",
              isUnanswered ? "bg-[#ff6683]" : isCorrect ? "bg-[#00d492]" : "bg-[#df1c41]",
            )}
          >
            <span className="text-2xl font-bold leading-[1.3] text-white">{number}</span>
          </div>

          <div className="flex min-h-[60px] min-w-0 items-center justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <h3 className="m-0 text-xl font-bold leading-[1.35] text-[var(--primary-800)]">{title}</h3>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex h-5 items-center rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-2 py-0.5 text-[10px] font-normal leading-normal tracking-[0.02em] text-[var(--color-student-heading)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            {actionButtons}
          </div>

          <ActiveDrillOutcomeIcon
            correct={isCorrect}
            unanswered={isUnanswered}
            variant="inline"
            className="justify-self-center"
          />

          <div className="flex min-w-0 flex-col gap-4">
            {showBlindReviewResult ? (
              <div className="flex min-w-0 flex-col gap-3">
                <p className="m-0 text-sm font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
                  Result
                </p>
                {resultRow("stroke")}
              </div>
            ) : null}
            <PracticeQuestionResultStatsRow
              targetTime={targetTime}
              yourTime={yourTime}
              yourTimeNote={yourTimeNote}
              difficulty={difficulty}
              popularityRows={resolvedPopularityRows}
              correctLetter={correctLetter}
              selectedLetter={selectedLetter}
              isUnanswered={isUnanswered}
              showPercentages={false}
            />
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_1px_rgba(13,13,18,0.04)]",
        className,
      )}
    >
      <div className="p-6">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 items-start gap-6">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-[14px]",
                questionResultBadgeClass(isUnanswered, isCorrect),
              )}
            >
              <span className="text-2xl font-bold leading-[1.3] text-white">{number}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-4">{questionCardBody}</div>
          </div>
        </div>
      </div>
    </article>
  )
}

export { PracticeQuestionResultCard }
