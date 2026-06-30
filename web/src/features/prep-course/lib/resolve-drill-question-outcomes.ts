import { resolveDrillResultLinkedRefs } from "@/features/prep-course/lib/resolve-drill-result-linked-refs"
import { isPracticeAnswerUnanswered } from "@/features/student/practice-session/practice-result-outcome-icon"
import type { PrepLessonActiveDrillAttempt, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

type DrillQuestionOutcome = {
  correct: boolean
  unanswered: boolean
}

function resolveDrillQuestionOutcomes(
  linkedQuestionRefs: PrepLessonLinkedQuestionRef[],
  attempt: PrepLessonActiveDrillAttempt,
): DrillQuestionOutcome[] {
  return resolveDrillResultLinkedRefs(linkedQuestionRefs, attempt).map((linked) => {
    const answer = attempt.answers.find((item) => item.questionId === linked.question_id)
    const unanswered = isPracticeAnswerUnanswered(answer)
    return {
      correct: !unanswered && (answer?.isCorrect ?? false),
      unanswered,
    }
  })
}

export { resolveDrillQuestionOutcomes, type DrillQuestionOutcome }
