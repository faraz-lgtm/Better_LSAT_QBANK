export { choiceIndexFromAnswer } from "@/features/student/practice-session/practice-choice-index"

export const GUEST_DIAGNOSTIC_MOCK_CORRECT_CHOICE_ID = "B"

export type GuestDiagnosticAnswerState = {
  selectedAnswer: string
  isCorrect: boolean
}

export function resolveGuestDiagnosticPassageHtml(
  getRegionHtml: (key: string, base: string) => string,
  passageKey: string,
  passageBody: string,
): string {
  if (!passageKey) return ""
  return getRegionHtml(passageKey, passageBody)
}

/** Fallback when a question has no embedded correct key (legacy preview clones). */
export function isGuestDiagnosticMockCorrectChoice(choiceId: string): boolean {
  return choiceId.toUpperCase() === GUEST_DIAGNOSTIC_MOCK_CORRECT_CHOICE_ID
}
