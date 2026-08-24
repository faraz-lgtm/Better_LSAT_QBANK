import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"

export type DiagnosticResultsSection = "mini" | "full"

export const DIAGNOSTIC_RESULTS_ROOT = "/app/diagnostic/results"
export const DIAGNOSTIC_RESULTS_MINI_HREF = `${DIAGNOSTIC_RESULTS_ROOT}/mini`
export const DIAGNOSTIC_RESULTS_FULL_HREF = `${DIAGNOSTIC_RESULTS_ROOT}/full`

export function isFullDiagnosticIntent(intentId: GuestDiagnosticIntentId): boolean {
  return intentId === "quick" || intentId === "full"
}

export function diagnosticResultsSectionFromIntent(intentId: GuestDiagnosticIntentId): DiagnosticResultsSection {
  return intentId === "mini" ? "mini" : "full"
}

export function diagnosticHistoryHref(section: DiagnosticResultsSection): string {
  return section === "mini" ? DIAGNOSTIC_RESULTS_MINI_HREF : DIAGNOSTIC_RESULTS_FULL_HREF
}

export function diagnosticAttemptHref(intentId: GuestDiagnosticIntentId, attemptId: string): string {
  return `${diagnosticHistoryHref(diagnosticResultsSectionFromIntent(intentId))}/${attemptId}`
}

export function isDiagnosticResultsPath(pathname: string): boolean {
  return pathname.startsWith(DIAGNOSTIC_RESULTS_ROOT) || pathname.startsWith("/diagnostic/results")
}

export function diagnosticResultsSectionFromPath(pathname: string): DiagnosticResultsSection | null {
  if (pathname.startsWith(`${DIAGNOSTIC_RESULTS_MINI_HREF}/`) || pathname === DIAGNOSTIC_RESULTS_MINI_HREF) {
    return "mini"
  }
  if (pathname.startsWith(`${DIAGNOSTIC_RESULTS_FULL_HREF}/`) || pathname === DIAGNOSTIC_RESULTS_FULL_HREF) {
    return "full"
  }
  return null
}

export function isDiagnosticResultsSectionPath(pathname: string, section: DiagnosticResultsSection): boolean {
  return diagnosticResultsSectionFromPath(pathname) === section
}
