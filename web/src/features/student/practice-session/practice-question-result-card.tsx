import { Bookmark, CheckCircle2, Pencil, XCircle } from "lucide-react"

import { resolveAnswerPopularityRows } from "@/features/student/explanation-detail/answer-popularity-rows"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import {
  PracticeAnswerPopularityBars,
  PracticeDifficultyMeter,
  correctChoiceLetter,
  difficultyLabelFromLevel,
  formatMmSs,
  formatPtQuestionTitle,
  tagsFromTopicName,
  targetTimeForDifficulty,
} from "@/features/student/practice-session/practice-results-ui"
import { cn } from "@/lib/utils"

type PracticeQuestionResultCardProps = {
  number: number
  detail: ExplanationDetailPayload | null
  titleOverride?: string
  isCorrect: boolean
  blindReviewCorrect?: boolean
  yourTimeSeconds?: number | null
  flagged?: boolean
}

function PracticeQuestionResultCard({
  number,
  detail,
  titleOverride,
  isCorrect,
  blindReviewCorrect,
  yourTimeSeconds,
  flagged,
}: PracticeQuestionResultCardProps) {
  const showBlindReviewResult = blindReviewCorrect !== undefined
  const title = titleOverride ?? (detail ? formatPtQuestionTitle(detail) : `Question ${number}`)
  const tags = detail ? tagsFromTopicName(detail.topicName) : []
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

  return (
    <article className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_1px_rgba(13,13,18,0.04)]">
      <div className="p-6">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">
          <div className="flex min-w-0 shrink-0 gap-6">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-[14px]",
                isCorrect ? "bg-[#00d492]" : "bg-[#df1c41]",
              )}
            >
              <span className="text-2xl font-bold leading-[1.3] text-white">{number}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold leading-[1.35] text-[#062357]">{title}</h3>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex h-5 items-center rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px] font-normal leading-[1.5] tracking-[0.02em] text-[#0d0d12]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Timing</p>
                <div className="flex gap-1">
                  <span className="w-20 text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
                    Target time:
                  </span>
                  <span className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
                    {targetTime}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="w-20 text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
                    Your time:
                  </span>
                  <span className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#0d47a1]">
                    {yourTime}
                  </span>
                  {yourTimeNote ? (
                    <span className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
                      {yourTimeNote}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Difficulty</p>
            <PracticeDifficultyMeter difficulty={difficulty} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Result</p>
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
            </div>

            <div className="flex flex-nowrap items-center gap-5">
              <div className="flex shrink-0 items-center gap-2.5">
                {isCorrect ? (
                  <CheckCircle2 className="size-6 shrink-0 text-[#00d492]" aria-hidden />
                ) : (
                  <XCircle className="size-6 shrink-0 text-[#df1c41]" aria-hidden />
                )}
                <span className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">Actual</span>
              </div>
              {showBlindReviewResult ? (
                <div className="flex shrink-0 items-center gap-2.5">
                  {blindReviewCorrect ? (
                    <CheckCircle2 className="size-6 shrink-0 text-[#00d492]" aria-hidden />
                  ) : (
                    <XCircle className="size-6 shrink-0 text-[#df1c41]" aria-hidden />
                  )}
                  <span className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
                    Blind Review
                  </span>
                </div>
              ) : null}
            </div>

            {popularityRows.length > 0 ? (
              <PracticeAnswerPopularityBars rows={popularityRows} correctLetter={correctLetter} />
            ) : (
              <PracticeAnswerPopularityBars
                rows={["A", "B", "C", "D", "E"].map((letter) => ({
                  letter,
                  count: 0,
                  pct: 0,
                }))}
                correctLetter={correctLetter}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export { PracticeQuestionResultCard }
