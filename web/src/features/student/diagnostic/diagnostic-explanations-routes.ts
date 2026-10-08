/** Student-app routes for Diagnostic Explanation (mirrors Academy Explanations). */

export const DIAGNOSTIC_EXPLANATIONS_HREF = "/app/diagnostic/explanations"

export function diagnosticExplanationQuestionDetailHref(questionId: string): string {
  return `${DIAGNOSTIC_EXPLANATIONS_HREF}/q/${encodeURIComponent(questionId)}`
}

export function isDiagnosticExplanationsPath(pathname: string): boolean {
  return (
    pathname === DIAGNOSTIC_EXPLANATIONS_HREF ||
    pathname.startsWith(`${DIAGNOSTIC_EXPLANATIONS_HREF}/`)
  )
}
