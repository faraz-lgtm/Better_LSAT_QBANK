import type { PrepTestSessionDetail } from "@/lib/api/analytics"

export type PrepTestResultQuestion = PrepTestSessionDetail["questions"][number] & {
  isExperimental: boolean
}

/**
 * Prefer API `isExperimental` when present. Otherwise apply the same rule as
 * `admin_sections.is_experimental` backfill: keep first RC + first two LR
 * (by section_number); mark additional LR/RC sections experimental.
 *
 * Needed while remote analytics still omit the flag (`pnpm dev:prod`).
 */
export function withExperimentalSectionFlags(
  questions: PrepTestSessionDetail["questions"],
): PrepTestResultQuestion[] {
  if (questions.some((q) => q.isExperimental === true)) {
    return questions.map((q) => ({
      ...q,
      isExperimental: q.isExperimental === true,
    }))
  }

  const lrNumbers = [
    ...new Set(
      questions.filter((q) => q.sectionType === "LR").map((q) => q.sectionNumber ?? 1),
    ),
  ].sort((a, b) => a - b)
  const rcNumbers = [
    ...new Set(
      questions.filter((q) => q.sectionType === "RC").map((q) => q.sectionNumber ?? 1),
    ),
  ].sort((a, b) => a - b)

  const scoredLr = new Set(lrNumbers.slice(0, 2))
  const scoredRc = new Set(rcNumbers.slice(0, 1))

  return questions.map((q) => {
    const sectionNumber = q.sectionNumber ?? 1
    if (q.sectionType === "RC") {
      return { ...q, isExperimental: !scoredRc.has(sectionNumber) }
    }
    if (q.sectionType === "LR") {
      return { ...q, isExperimental: !scoredLr.has(sectionNumber) }
    }
    return { ...q, isExperimental: false }
  })
}

export function scorePrepTestQuestions(questions: PrepTestResultQuestion[]): {
  correct: number
  incorrect: number
  totalQuestions: number
} {
  const scored = questions.filter((q) => !q.isExperimental)
  const correct = scored.filter((q) => q.actualCorrect).length
  const totalQuestions = scored.length
  return {
    correct,
    incorrect: totalQuestions - correct,
    totalQuestions,
  }
}
