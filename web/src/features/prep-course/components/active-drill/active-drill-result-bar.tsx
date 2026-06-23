import { CheckCircle2, ChevronRight, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import type { PrepLessonActiveDrillAttempt } from "@/lib/api/prep-course"

type ActiveDrillResultBarProps = {
  attempt: PrepLessonActiveDrillAttempt
  lessonTitle?: string
  onRetake?: () => void
  retaking?: boolean
}

function ActiveDrillResultBar({
  attempt,
  lessonTitle,
  onRetake,
  retaking = false,
}: ActiveDrillResultBarProps) {
  const allCorrect = attempt.questionCount > 0 && attempt.rawScore === attempt.questionCount

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-[24px] border border-[#dfe1e7] bg-white shadow-[0px_1px_1px_rgba(13,13,18,0.04)]">
      <div className="flex flex-col items-center gap-4 p-6">
        {lessonTitle ? (
          <h2 className="m-0 text-center text-xl font-bold leading-[1.35] text-[#062357]">{lessonTitle}</h2>
        ) : null}

        <div className="flex h-[76px] w-full min-w-0 items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="m-0 text-base font-medium leading-[1.5] tracking-[0.02em] text-[#666d80]">Your Score</p>
            <p className="m-0 whitespace-nowrap text-[#062357]">
              <span className="text-[32px] font-bold leading-[1.25]">
                {attempt.rawScore}/{attempt.questionCount}
              </span>
              <span className="text-2xl font-bold leading-[1.3] text-[#666d80]"> Correct</span>
            </p>
          </div>

          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full",
              allCorrect ? "bg-[#10b981]" : "bg-[#df1c41]",
            )}
          >
            {allCorrect ? (
              <CheckCircle2 className="size-7 text-white" strokeWidth={2.5} aria-hidden />
            ) : (
              <XCircle className="size-7 text-white" strokeWidth={2.5} aria-hidden />
            )}
          </div>

          {onRetake ? (
            <button
              type="button"
              disabled={retaking}
              onClick={onRetake}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[16px] border border-[#0b4e6e] bg-[#0d47a1] px-4 text-base font-semibold tracking-[0.02em] text-white shadow-[0_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-600)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {retaking ? "Starting…" : "Retake"}
              <ChevronRight className="size-5 shrink-0" aria-hidden />
            </button>
          ) : (
            <div className="hidden w-[108px] shrink-0 sm:block" aria-hidden />
          )}
        </div>
      </div>
    </section>
  )
}

export { ActiveDrillResultBar }
