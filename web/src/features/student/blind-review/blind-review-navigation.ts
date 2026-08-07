import type { BlindReviewDetailResponse } from "@/features/student/blind-review/blind-review-types"

/** Unanswered or originally incorrect — highlight in blind review UI (Figma `18617:33677`). */
export function isQuestionRecommendedForBlindReview(
  actualAnswer: { isCorrect: boolean } | undefined,
): boolean {
  return actualAnswer == null || actualAnswer.isCorrect === false
}

export function firstBlindReviewSectionSessionId(
  detail: BlindReviewDetailResponse,
): string | null {
  const section = detail.sections.find((s) => s.practiceable && s.sectionSessionId)
  return section?.sectionSessionId ?? null
}

export function blindReviewSectionSessionPath(
  prepTestId: string,
  sectionSessionId: string,
): string {
  const q = new URLSearchParams({ blindReview: "1", prepTestId })
  return `/app/practice/sections/session/${encodeURIComponent(sectionSessionId)}?${q.toString()}`
}

/** Post-results Review mode — Figma `18617:33941` / `18617:34737` / `18617:35029`. */
export function resultsReviewSectionSessionPath(
  prepTestId: string,
  sectionSessionId: string,
  prepTestSessionId?: string,
  options?: { hasBlindReview?: boolean },
): string {
  const q = new URLSearchParams({ review: "1", prepTestId })
  if (prepTestSessionId) q.set("prepTestSessionId", prepTestSessionId)
  if (options?.hasBlindReview) q.set("hasBr", "1")
  return `/app/practice/sections/session/${encodeURIComponent(sectionSessionId)}?${q.toString()}`
}

export function prepTestResultsPath(prepTestSessionId: string): string {
  return `/app/analytics/preptests/results/${encodeURIComponent(prepTestSessionId)}`
}

type BlindReviewSkipApi = {
  skipBlindReview(prepTestId: string): Promise<unknown>
}

export async function skipBlindReviewBestEffort(
  practiceApi: BlindReviewSkipApi,
  prepTestId: string,
): Promise<void> {
  await practiceApi.skipBlindReview(prepTestId).catch(() => undefined)
}
