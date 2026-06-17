import { ActiveDrillResultBar } from "@/features/prep-course/components/active-drill/active-drill-result-bar"
import { ActiveDrillQuestionResultDetail } from "@/features/prep-course/components/active-drill/active-drill-question-result-detail"
import { resolveDrillResultLinkedRefs } from "@/features/prep-course/lib/resolve-drill-result-linked-refs"
import type { PrepLessonActiveDrillAttempt, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

type AdaptiveDrillResultsPanelProps = {
  attempt: PrepLessonActiveDrillAttempt
  linkedQuestionRefs: PrepLessonLinkedQuestionRef[]
  onRetake?: () => void
  retaking?: boolean
}

function AdaptiveDrillResultsPanel({
  attempt,
  linkedQuestionRefs,
  onRetake,
  retaking = false,
}: AdaptiveDrillResultsPanelProps) {
  const items = resolveDrillResultLinkedRefs(linkedQuestionRefs, attempt)

  return (
    <div className="space-y-6">
      <ActiveDrillResultBar attempt={attempt} onRetake={onRetake} retaking={retaking} />

      <div className="space-y-4">
        {items.map((linked, index) => (
          <ActiveDrillQuestionResultDetail
            key={linked.question_id}
            linked={linked}
            attempt={attempt}
            sequenceNumber={index + 1}
          />
        ))}
      </div>
    </div>
  )
}

export { AdaptiveDrillResultsPanel }
