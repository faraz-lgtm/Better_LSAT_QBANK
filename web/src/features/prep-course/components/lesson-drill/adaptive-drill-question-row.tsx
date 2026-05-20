import { Check, X } from "lucide-react"

import type { PrepLessonActiveDrillAttempt, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

type AdaptiveDrillQuestionRowProps = {
  index: number
  linked: PrepLessonLinkedQuestionRef
  attempt: PrepLessonActiveDrillAttempt
}

function formatPtLabel(linked: PrepLessonLinkedQuestionRef): string {
  const pt = linked.prep_test_module_id ?? linked.prep_test_title ?? "PrepTest"
  const section = linked.section_number != null ? `S${linked.section_number}` : "S—"
  const q = linked.question_number != null ? `Q${linked.question_number}` : "Q—"
  return `PT ${pt} · ${section} · ${q}`
}

function AdaptiveDrillQuestionRow({ index, linked, attempt }: AdaptiveDrillQuestionRowProps) {
  const answer = attempt.answers.find((a) => a.questionId === linked.question_id)
  const isCorrect = answer?.isCorrect ?? false

  return (
    <article className="rounded-2xl border border-[#dfe1e7] bg-white p-5 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${isCorrect ? "bg-[#1b7f4e]" : "bg-[#df1c41]"}`}
          aria-hidden
        >
          {index + 1}
        </div>
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-[#e8f5e9]" : "bg-[#fde8ec]"}`}
          aria-hidden
        >
          {isCorrect ? (
            <Check className="size-5 text-[#1b7f4e]" strokeWidth={2.5} />
          ) : (
            <X className="size-5 text-[#df1c41]" strokeWidth={2.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1a1b25]">{formatPtLabel(linked)}</p>
          <p className="mt-1 text-sm text-[#666d80]">{isCorrect ? "Correct" : "Incorrect"}</p>
        </div>
      </div>
    </article>
  )
}

export { AdaptiveDrillQuestionRow }
