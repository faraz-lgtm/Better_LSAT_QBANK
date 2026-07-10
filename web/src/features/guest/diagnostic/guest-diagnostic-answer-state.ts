import type { DrillQuestion } from "@/features/student/drills/drill-types"

import {
  isGuestDiagnosticMockCorrectChoice,
  type GuestDiagnosticAnswerState,
} from "@/features/guest/diagnostic/guest-diagnostic-exam-utils"

export function buildGuestDiagnosticAnswerState(
  question: DrillQuestion,
  choiceId: string,
): GuestDiagnosticAnswerState {
  const expected = question.correctChoiceId?.toUpperCase() ?? ""
  const selected = choiceId.trim().toUpperCase()
  const isCorrect = expected
    ? selected === expected
    : isGuestDiagnosticMockCorrectChoice(choiceId)
  return { selectedAnswer: choiceId, isCorrect }
}
