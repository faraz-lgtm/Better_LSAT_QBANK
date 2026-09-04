import { Check, X } from "lucide-react"

import type { PrepLessonActiveDrillAttempt, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

type ActiveDrillQuestionSummaryProps = {
  linked: PrepLessonLinkedQuestionRef
  attempt: PrepLessonActiveDrillAttempt
}

function formatPtLabel(linked: PrepLessonLinkedQuestionRef): string {
  const pt = linked.prep_test_module_id ?? linked.prep_test_title ?? "PrepTest"
  const section = linked.section_number != null ? `S${linked.section_number}` : "S—"
  const q = linked.question_number != null ? `Q${linked.question_number}` : "Q—"
  return `PT ${pt} · ${section} · ${q}`
}

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function ActiveDrillQuestionSummary({ linked, attempt }: ActiveDrillQuestionSummaryProps) {
  const answer = attempt.answers.find((a) => a.questionId === linked.question_id) ?? attempt.answers[0]
  const isCorrect = answer?.isCorrect ?? false

  return (
    <article className="rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-5 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-[var(--explanation-answered-bg)]" : "bg-[color-mix(in srgb, var(--destructive) 12%, var(--greyscale-0))]"}`}
          aria-hidden
        >
          {isCorrect ? (
            <Check className="size-6 text-[var(--explanation-answered)]" strokeWidth={2.5} />
          ) : (
            <X className="size-6 text-[var(--destructive)]" strokeWidth={2.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-student-heading)]">{formatPtLabel(linked)}</p>
          <p className="mt-1 text-sm text-[var(--greyscale-500)]">
            {isCorrect ? "Correct" : "Incorrect"} · {formatElapsed(attempt.elapsedSeconds)}
          </p>
        </div>
        <p className="text-lg font-bold text-[var(--color-student-heading)]">
          {attempt.rawScore}/{attempt.questionCount} Correct
        </p>
      </div>
    </article>
  )
}

export { ActiveDrillQuestionSummary }
