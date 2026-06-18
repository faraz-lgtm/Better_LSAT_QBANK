import { CheckCircle2, ChevronRight, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PrepLessonActiveDrillAttempt } from "@/lib/api/prep-course"

type ActiveDrillResultBarProps = {
  attempt: PrepLessonActiveDrillAttempt
  onRetake?: () => void
  retaking?: boolean
}

function ActiveDrillResultBar({ attempt, onRetake, retaking = false }: ActiveDrillResultBarProps) {
  const allCorrect = attempt.questionCount > 0 && attempt.rawScore === attempt.questionCount
  const blindReview = attempt.blindReview
  const blindReviewAllCorrect =
    blindReview != null &&
    attempt.questionCount > 0 &&
    blindReview.rawScore === attempt.questionCount

  return (
    <section className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_1px_rgba(13,13,18,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-6 px-6 py-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-sm font-semibold tracking-[0.28px] text-[#6a7282]">Your Score</p>
            <p className="text-[40px] font-bold leading-[1.2] text-[#062357]">
              {attempt.rawScore}/{attempt.questionCount}{" "}
              <span className="text-xl font-semibold text-[#666d80]">Correct</span>
            </p>
          </div>
          <div
            className={`flex size-14 items-center justify-center rounded-full ${allCorrect ? "bg-[#e8f5e9]" : "bg-[#fde8ec]"}`}
          >
            {allCorrect ? (
              <CheckCircle2 className="size-8 text-[#00d492]" strokeWidth={2} aria-hidden />
            ) : (
              <XCircle className="size-8 text-[#df1c41]" strokeWidth={2} aria-hidden />
            )}
          </div>
        </div>
        {onRetake ? (
          <Button
            type="button"
            variant="default"
            className="gap-1"
            disabled={retaking}
            onClick={onRetake}
          >
            {retaking ? "Starting…" : "Retake"}
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>

      {blindReview ? (
        <div className="border-t border-[#eceff3] bg-[#f6f8fa] px-6 py-5">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            <div className="min-w-[120px]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#062357]">Your prediction</p>
              <p className="mt-1 text-[28px] font-bold leading-[1.2] text-[#062357] sm:text-[32px]">
                {attempt.rawScore}/{attempt.questionCount}
              </p>
            </div>
            <div className="hidden h-12 w-px shrink-0 bg-[#dfe1e7] sm:block" aria-hidden />
            <div className="flex min-w-[120px] flex-wrap items-center gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#df1c41]">Blind review</p>
                <p className="mt-1 text-[28px] font-bold leading-[1.2] text-[#df1c41] sm:text-[32px]">
                  {blindReview.rawScore}/{attempt.questionCount}
                </p>
              </div>
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-full ${blindReviewAllCorrect ? "bg-[#e8f5e9]" : "bg-[#fde8ec]"}`}
              >
                {blindReviewAllCorrect ? (
                  <CheckCircle2 className="size-7 text-[#00d492]" strokeWidth={2} aria-hidden />
                ) : (
                  <XCircle className="size-7 text-[#df1c41]" strokeWidth={2} aria-hidden />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export { ActiveDrillResultBar }
