import { Bookmark, Pencil } from "lucide-react"

import { resolveAnswerPopularityRows } from "@/features/student/explanation-detail/answer-popularity-rows"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { PracticeResultOutcomeIcon } from "@/features/student/practice-session/practice-result-outcome-icon"
import {
  PracticeQuestionResultCardLayout,
  correctChoiceLetter,
  difficultyLabelFromLevel,
  formatMmSs,
  formatPtQuestionTitle,
  resolveQuestionResultTags,
  targetTimeForDifficulty,
} from "@/features/student/practice-session/practice-results-ui"
import { cn } from "@/lib/utils"

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
  flagged?: boolean
  variant?: "default" | "active-drill" | "in-section"
  className?: string
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
  flagged,
  variant = "default",
  className,
}: PracticeQuestionResultCardProps) {
  const showBlindReviewResult = showBlindReview
  const title = titleOverride ?? (detail ? formatPtQuestionTitle(detail) : `Question ${number}`)
  const tags = detail ? resolveQuestionResultTags(detail) : []
  const difficulty = difficultyLabelFromLevel(detail?.difficulty ?? 3)
  const targetTime = targetTimeForDifficulty(difficulty)
  const yourTime =
    yourTimeSeconds != null && yourTimeSeconds >= 0 ? formatMmSs(yourTimeSeconds) : "—"
  const targetSec =
    difficulty === "Hardest" || difficulty === "Hard"
      ? 105
      : difficulty === "Medium"
        ? 90
        : 75
  const yourSec = yourTimeSeconds ?? 0
  const deltaSec = targetSec - yourSec
  const yourTimeNote =
    yourTimeSeconds != null && deltaSec > 0
      ? `(${formatMmSs(deltaSec)} under)`
      : yourTimeSeconds != null && deltaSec < 0
        ? `(${formatMmSs(-deltaSec)} over)`
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

  const actionButtons = (
    <div className="flex shrink-0 gap-4">
      {explanationHref ? (
        <a
          href={explanationHref}
          className="flex size-9 items-center justify-center rounded-xl border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80] transition-colors hover:bg-white"
          aria-label="View explanation"
        >
          <Pencil className="size-[18px]" aria-hidden />
        </a>
      ) : (
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-xl border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80]"
          aria-label="Edit question"
          disabled
        >
          <Pencil className="size-[18px]" aria-hidden />
        </button>
      )}
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-xl border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80]"
        aria-label={flagged ? "Flagged" : "Bookmark question"}
        disabled
      >
        <Bookmark
          className={cn("size-[18px]", flagged ? "fill-[#0d47a1] text-[#0d47a1]" : "")}
          aria-hidden
        />
      </button>
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
        <span className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">Actual</span>
      </div>
      {showBlindReviewResult ? (
        <div className="flex shrink-0 items-center gap-2.5">
          <PracticeResultOutcomeIcon
            correct={Boolean(blindReviewCorrect)}
            unanswered={blindReviewUnanswered}
            variant={iconVariant}
            className={iconVariant === "stroke" ? "size-6" : undefined}
          />
          <span className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
            Blind Review
          </span>
        </div>
      ) : null}
    </div>
  )

  const resolvedPopularityRows =
    popularityRows.length > 0
      ? popularityRows
      : ["A", "B", "C", "D", "E"].map((letter) => ({
          letter,
          count: 0,
          pct: 0,
        }))

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
          "border-t border-[#dfe1e7] bg-white p-6",
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
          "relative min-w-0 max-w-full overflow-hidden rounded-[24px] border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_1px_rgba(13,13,18,0.04)]",
          className,
        )}
      >
        <div className="flex min-w-0 items-start gap-6">
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

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[20px] border border-[#dfe1e7] bg-white shadow-[0px_1px_1px_rgba(13,13,18,0.04)]",
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
