import type { PrepLessonActiveDrillAttempt, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

function resolveDrillResultLinkedRefs(
  linkedQuestionRefs: PrepLessonLinkedQuestionRef[],
  attempt: PrepLessonActiveDrillAttempt,
): PrepLessonLinkedQuestionRef[] {
  if (linkedQuestionRefs.length > 0) return linkedQuestionRefs
  return attempt.answers.map((answer, index) => ({
    question_id: answer.questionId,
    question_number: index + 1,
    prep_test_module_id: null,
    prep_test_title: null,
    section_number: null,
    section_type: null,
    section_title: null,
  }))
}

export { resolveDrillResultLinkedRefs }
