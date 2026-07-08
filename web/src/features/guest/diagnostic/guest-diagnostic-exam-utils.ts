import type { DrillQuestion } from "@/features/student/drills/drill-types"

/** Mock preview questions treat choice B as correct. */
export const GUEST_DIAGNOSTIC_MOCK_CORRECT_CHOICE_ID = "B"

export type GuestDiagnosticAnswerState = {
  selectedAnswer: string
  isCorrect: boolean
}

export function choiceIndexFromAnswer(
  choices: DrillQuestion["choices"],
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

export function isGuestDiagnosticMockCorrectChoice(choiceId: string): boolean {
  return choiceId.toUpperCase() === GUEST_DIAGNOSTIC_MOCK_CORRECT_CHOICE_ID
}

export function estimateGuestDiagnosticScaledScore(correctCount: number, questionCount: number): number {
  if (questionCount <= 0) return 120
  const ratio = correctCount / questionCount
  return Math.round(120 + ratio * 60)
}

export function estimateGuestDiagnosticPercentile(correctCount: number, questionCount: number): number {
  if (questionCount <= 0) return 0
  const ratio = correctCount / questionCount
  return Math.round(ratio * 99 * 10) / 10
}
