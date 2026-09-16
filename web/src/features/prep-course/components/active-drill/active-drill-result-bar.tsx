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
    <section className="min-w-0 max-w-full overflow-hidden rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6">
      <div className="flex flex-col items-center gap-4">
        {lessonTitle ? (
          <h2 className="m-0 text-center text-[20px] font-bold leading-[1.35] text-[var(--primary-800)]">
            {lessonTitle}
          </h2>
        ) : null}

        <div className="flex h-[76px] w-full min-w-0 items-center justify-between gap-4">
          <div className="flex min-w-0 shrink-0 flex-col gap-2">
            <p className="m-0 text-base font-medium leading-[1.5] tracking-[0.32px] text-[var(--greyscale-500)]">
              Your Score
            </p>
            <p className="m-0 whitespace-nowrap text-[var(--primary-800)]">
              <span className="text-[32px] font-bold leading-[1.25]">
                {attempt.rawScore}/{attempt.questionCount}
              </span>
              <span className="text-2xl font-bold leading-[1.3] text-[var(--greyscale-500)]"> Correct</span>
            </p>
          </div>

          {questionOutcomes.length > 0 ? (
            <div className="flex min-w-0 flex-1 items-center justify-center gap-3 px-2">
              {questionOutcomes.map((outcome, index) => (
                <ActiveDrillOutcomeIcon
                  key={index}
                  correct={outcome.correct}
                  unanswered={outcome.unanswered}
                  variant="summary"
                />
              ))}
            </div>
          ) : (
            <div className="min-w-0 flex-1" aria-hidden />
          )}

          {onRetake ? (
            <button
              type="button"
              disabled={retaking}
              onClick={onRetake}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[14px] border border-[var(--primary-border)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold tracking-[0.28px] text-white shadow-[0_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-600)] disabled:cursor-not-allowed disabled:opacity-70"
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
