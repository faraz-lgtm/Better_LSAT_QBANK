import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"

/** Free-plan teaser: first N explanations unlocked on Review in Tester. */
function freeDiagnosticExplanationLimit(intentId: GuestDiagnosticIntentId): number {
  if (intentId === "mini") return 5
  if (intentId === "quick") return 10
  return 10
}

/**
 * Premium students see every explanation. Free students only see the first N
 * questions (1-based index) for mini/quick teaser access.
 */
function canShowDiagnosticExplanation(input: {
  intentId: GuestDiagnosticIntentId
  /** 1-based question index in the diagnostic. */
  questionNumber: number
  hasActiveCore: boolean
}): boolean {
  if (input.hasActiveCore) return true
  if (input.questionNumber < 1) return false
  return input.questionNumber <= freeDiagnosticExplanationLimit(input.intentId)
}

export { canShowDiagnosticExplanation, freeDiagnosticExplanationLimit }
