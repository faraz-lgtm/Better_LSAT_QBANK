import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import { resolveDiagnosticSourceQuestion } from "@/features/guest/diagnostic/mini-diagnostic-content"

/** Free Mini Diagnostic: first N result / Review explanations unlocked. */
const FREE_MINI_DIAGNOSTIC_EXPLANATION_LIMIT = 5

/**
 * Free Full Section (`quick`) and Full Diagnostic (`full`): first N explanations unlocked.
 * Remaining rows stay blurred until upgrade.
 */
const FREE_FULL_DIAGNOSTIC_EXPLANATION_LIMIT = 10

const MINI_DIAG_QUESTION_ID = /^mini-diag-q/i
const SECTION_DIAG_QUESTION_ID = /^section-diag-q/i
const PREVIEW_DIAG_QUESTION_ID = /^guest-diagnostic-preview-q/i

/** Free-plan teaser: first N explanations unlocked on Review in Tester / results. */
function freeDiagnosticExplanationLimit(intentId: GuestDiagnosticIntentId): number {
  if (intentId === "mini") return FREE_MINI_DIAGNOSTIC_EXPLANATION_LIMIT
  // quick (Full Section) + full (Full Diagnostic)
  return FREE_FULL_DIAGNOSTIC_EXPLANATION_LIMIT
}

/**
 * Map a catalog / review question id onto the diagnostic intent used for teaser limits.
 * Mini → 5; section + full (preview) → 10.
 */
function resolveDiagnosticExplanationIntentId(questionId: string): GuestDiagnosticIntentId | null {
  const id = questionId.trim()
  if (!id) return null
  if (MINI_DIAG_QUESTION_ID.test(id)) return "mini"
  if (SECTION_DIAG_QUESTION_ID.test(id)) return "quick"
  if (PREVIEW_DIAG_QUESTION_ID.test(id)) return "full"
  const source = resolveDiagnosticSourceQuestion(id)
  if (!source) return null
  if (MINI_DIAG_QUESTION_ID.test(source.sourceItemId)) return "mini"
  return "quick"
}

/**
 * Premium students see every explanation. Free students only see the first N
 * questions (1-based index) for mini / full-section teaser access — including
 * Review in Tester.
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

/** Catalog / detail routes keyed by `sourceItemId` (e.g. mini-diag-q6). */
function canShowDiagnosticExplanationForQuestionId(input: {
  questionId: string
  hasActiveCore: boolean
}): boolean {
  if (input.hasActiveCore) return true
  const intentId = resolveDiagnosticExplanationIntentId(input.questionId)
  const source = resolveDiagnosticSourceQuestion(input.questionId, intentId ?? undefined)
  if (!intentId || !source) return false
  return canShowDiagnosticExplanation({
    intentId,
    questionNumber: source.questionNumber,
    hasActiveCore: false,
  })
}

export {
  canShowDiagnosticExplanation,
  canShowDiagnosticExplanationForQuestionId,
  canShowDiagnosticResultDetails,
  freeDiagnosticExplanationLimit,
  resolveDiagnosticExplanationIntentId,
  FREE_FULL_DIAGNOSTIC_EXPLANATION_LIMIT,
  FREE_MINI_DIAGNOSTIC_EXPLANATION_LIMIT,
}
