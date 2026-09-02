import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"

/** Free-plan teaser: first N explanations unlocked on Review in Tester / results. */
function freeDiagnosticExplanationLimit(_intentId: GuestDiagnosticIntentId): number {
  // Free users see the first 5 result rows on Mini and Full (incl. section diagnostic),
  // then the analytics limit gate.
  return 5
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

/**
 * Results-list access. Free students unlock the first 5 rows on Mini and Full
 * (including Full Section / quick). Remaining rows stay gated until upgrade.
 */
function canShowDiagnosticResultDetails(input: {
  intentId: GuestDiagnosticIntentId
  questionNumber: number
  hasActiveCore: boolean
}): boolean {
  return canShowDiagnosticExplanation(input)
}

export { canShowDiagnosticExplanation, canShowDiagnosticResultDetails, freeDiagnosticExplanationLimit }
