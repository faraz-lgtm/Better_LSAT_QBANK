import type { DrillQuestionOutcome } from "@/features/prep-course/lib/resolve-drill-question-outcomes"
import { ActiveDrillOutcomeIcon } from "@/features/prep-course/components/active-drill/active-drill-outcome-icon"
import type { PrepLessonActiveDrillAttempt } from "@/lib/api/prep-course"

type ActiveDrillResultBarProps = {
  attempt: PrepLessonActiveDrillAttempt
  lessonTitle?: string
  questionOutcomes?: DrillQuestionOutcome[]
  onRetake?: () => void
  retaking?: boolean
  retakeLabel?: string
}

function ActiveDrillResultBar({
  attempt,
  lessonTitle,
  questionOutcomes = [],
  onRetake,
  retaking = false,
  retakeLabel = "Retake",
}: ActiveDrillResultBarProps) {
  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-4 sm:rounded-[24px] sm:p-6">
      <div className="flex flex-col items-stretch gap-4 sm:items-center">
        {lessonTitle ? (
          <h2 className="m-0 text-center text-[18px] font-bold leading-[1.35] text-[var(--primary-800)] sm:text-[20px]">
            {lessonTitle}
          </h2>
        ) : null}

        {/* Mobile: stacked score → icons → CTA. Desktop: single row. */}
        <div className="flex w-full min-w-0 flex-col gap-4 sm:h-[76px] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-end justify-between gap-3 sm:shrink-0 sm:flex-col sm:items-start sm:justify-start sm:gap-2">
            <div className="flex min-w-0 flex-col gap-1 sm:gap-2">
              <p className="m-0 text-sm font-medium leading-[1.5] tracking-[0.32px] text-[var(--greyscale-500)] sm:text-base">
                Your Score
              </p>
              <p className="m-0 whitespace-nowrap text-[var(--primary-800)]">
                <span className="text-[28px] font-bold leading-[1.25] sm:text-[32px]">
                  {attempt.rawScore}/{attempt.questionCount}
                </span>
                <span className="text-xl font-bold leading-[1.3] text-[var(--greyscale-500)] sm:text-2xl">
                  {" "}
                  Correct
                </span>
              </p>
            </div>
          </div>

          {questionOutcomes.length > 0 ? (
            <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:flex-1 sm:gap-3 sm:px-2">
              {questionOutcomes.map((outcome, index) => (
                <ActiveDrillOutcomeIcon
                  key={index}
                  correct={outcome.correct}
                  unanswered={outcome.unanswered}
                  variant="summary"
                  className="size-10 sm:size-12"
                />
              ))}
            </div>
          ) : (
            <div className="hidden min-w-0 flex-1 sm:block" aria-hidden />
          )}

          {onRetake ? (
            <button
              type="button"
              disabled={retaking}
              onClick={onRetake}
              className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-[14px] border border-[var(--primary-border)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold tracking-[0.28px] text-white shadow-[0_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-600)] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {retaking ? "Starting…" : retakeLabel}
              <img
                src="/figma/active-drill/chevron-right.svg"
                alt=""
                width={16}
                height={16}
                className="size-4 shrink-0"
              />
            </button>
          ) : (
            <div className="hidden w-[105px] shrink-0 sm:block" aria-hidden />
          )}
        </div>
      </div>
    </section>
  )
}

export { ActiveDrillResultBar }
