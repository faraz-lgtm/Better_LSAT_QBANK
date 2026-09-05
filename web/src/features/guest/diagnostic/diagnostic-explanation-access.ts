import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"

/** Free Mini Diagnostic: first N result / Review explanations unlocked. */
const FREE_MINI_DIAGNOSTIC_EXPLANATION_LIMIT = 5

/**
 * Free Full Section (`quick`) and Full Diagnostic (`full`): first N explanations unlocked.
 * Remaining rows stay blurred until upgrade.
 */
const FREE_FULL_DIAGNOSTIC_EXPLANATION_LIMIT = 10

/** Free-plan teaser: first N explanations unlocked on Review in Tester / results. */
function freeDiagnosticExplanationLimit(intentId: GuestDiagnosticIntentId): number {
  if (intentId === "mini") return FREE_MINI_DIAGNOSTIC_EXPLANATION_LIMIT
  // quick (Full Section) + full (Full Diagnostic)
  return FREE_FULL_DIAGNOSTIC_EXPLANATION_LIMIT
}

/**
 * Premium students see every explanation. Free students only see the first N
 * questions (1-based index) for mini / full-section teaser access.
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
 * Results-list access. Free students unlock the first 5 rows on Mini and the
 * first 10 on Full Section / Full. Remaining rows stay blurred until upgrade.
 */
function canShowDiagnosticResultDetails(input: {
  intentId: GuestDiagnosticIntentId
  questionNumber: number
  hasActiveCore: boolean
}): boolean {
  return canShowDiagnosticExplanation(input)
}

export {
  canShowDiagnosticExplanation,
  canShowDiagnosticResultDetails,
  freeDiagnosticExplanationLimit,
  FREE_FULL_DIAGNOSTIC_EXPLANATION_LIMIT,
  FREE_MINI_DIAGNOSTIC_EXPLANATION_LIMIT,
}
