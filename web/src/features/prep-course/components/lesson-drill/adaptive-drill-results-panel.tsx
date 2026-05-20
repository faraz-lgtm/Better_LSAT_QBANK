import { Check, X } from "lucide-react"

import { ActiveDrillResultBar } from "@/features/prep-course/components/active-drill/active-drill-result-bar"
import { AdaptiveDrillQuestionRow } from "@/features/prep-course/components/lesson-drill/adaptive-drill-question-row"
import type { PrepLessonActiveDrillAttempt, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

type AdaptiveDrillResultsPanelProps = {
  attempt: PrepLessonActiveDrillAttempt
  linkedQuestionRefs: PrepLessonLinkedQuestionRef[]
  onReview?: () => void
}

function AdaptiveDrillResultsPanel({ attempt, linkedQuestionRefs, onReview }: AdaptiveDrillResultsPanelProps) {
  const items =
    linkedQuestionRefs.length > 0
      ? linkedQuestionRefs
      : attempt.answers.map((a, i) => ({
          question_id: a.questionId,
          question_number: i + 1,
          prep_test_module_id: null,
          prep_test_title: null,
          section_number: null,
          section_type: null,
          section_title: null,
        }))

  return (
    <div className="space-y-6">
      <ActiveDrillResultBar attempt={attempt} onReview={onReview} />

      <div className="rounded-2xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#666d80]">Your Score</p>
            <p className="mt-1 text-2xl font-bold text-[#062357]">
              {attempt.rawScore}/{attempt.questionCount} Correct
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {items.map((linked) => {
              const answer = attempt.answers.find((a) => a.questionId === linked.question_id)
              const isCorrect = answer?.isCorrect ?? false
              return (
                <span
                  key={linked.question_id}
                  className={`flex size-9 items-center justify-center rounded-full text-white ${isCorrect ? "bg-[#1b7f4e]" : "bg-[#df1c41]"}`}
                  aria-hidden
                >
                  {isCorrect ? <Check className="size-4" strokeWidth={2.5} /> : <X className="size-4" strokeWidth={2.5} />}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((linked, index) => (
          <AdaptiveDrillQuestionRow
            key={linked.question_id}
            index={index}
            linked={linked}
            attempt={attempt}
          />
        ))}
      </div>
    </div>
  )
}

export { AdaptiveDrillResultsPanel }
