export const GUEST_DIAGNOSTIC_MOCK_CORRECT_CHOICE_ID = "B"

export type GuestDiagnosticAnswerState = {
  selectedAnswer: string
  isCorrect: boolean
}

export function choiceIndexFromAnswer(
  choices: { id: string }[],
  selectedAnswer: string,
): number | null {
  const letter = selectedAnswer.trim().toUpperCase()
  const byId = choices.findIndex((c) => c.id.toUpperCase() === letter)
  if (byId >= 0) return byId
  const idx = letter.charCodeAt(0) - 65
  if (idx >= 0 && idx < choices.length) return idx
  return null
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
