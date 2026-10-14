import type { ExplanationDetailTabId } from "@/features/student/explanation-detail/types"

/**
 * Resolves the detail tab from the URL.
 * Pass `showExplanationTab: true` while video availability is still loading when the
 * URL already asks for `?tab=explanation`, so we do not flash the Question tab.
 */
export function resolveDiagnosticExplanationTab(
  raw: string | null,
  showExplanationTab: boolean,
): ExplanationDetailTabId {
  if (raw === "analytics") return "analytics"
  if (raw === "explanation" && showExplanationTab) return "explanation"
  return "question"
}
