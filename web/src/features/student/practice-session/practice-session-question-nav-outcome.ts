import type { PracticeSessionQuestionNavOutcome } from "@/features/student/practice-session/practice-session-question-nav-button"

/** Resolve Review-footer outcome from a stored answer (or lack of one). */
function resolvePracticeSessionQuestionNavOutcome(
  answer: { selectedAnswer?: string | null; isCorrect?: boolean } | null | undefined,
): PracticeSessionQuestionNavOutcome {
  if (answer == null || !String(answer.selectedAnswer ?? "").trim()) return "unanswered"
  return answer.isCorrect ? "correct" : "incorrect"
}

export { resolvePracticeSessionQuestionNavOutcome }
