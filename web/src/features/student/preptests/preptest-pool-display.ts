import type {
  PrepTestPoolAttempt,
  PrepTestPoolFilter,
  PrepTestPoolItem,
  PrepTestPoolStatusCounts,
} from "@/features/student/preptests/preptest-types"

/** Timed take that is paused/saved — not Blind Review. */
export function isPrepTestInProcess(
  item: Pick<PrepTestPoolItem, "status" | "blindReviewStatus">,
): boolean {
  return item.status === "in_progress" && item.blindReviewStatus == null
}

export function matchesPrepTestPoolFilter(
  item: Pick<PrepTestPoolItem, "status" | "blindReviewStatus">,
  filter: PrepTestPoolFilter | undefined,
): boolean {
  if (!filter || filter === "all") return true
  if (filter === "blind_review") return item.blindReviewStatus != null
  if (filter === "in_progress") return isPrepTestInProcess(item)
  return item.status === filter
}

export function filterPrepTestPoolItems(
  items: PrepTestPoolItem[],
  filter: PrepTestPoolFilter | undefined,
): PrepTestPoolItem[] {
  return items.filter((item) => matchesPrepTestPoolFilter(item, filter))
}

export function adjustPrepTestPoolStatusCounts(
  counts: PrepTestPoolStatusCounts,
  items: PrepTestPoolItem[],
  filter: PrepTestPoolFilter | undefined,
): PrepTestPoolStatusCounts {
  const staleInProcess = filter === "in_progress" && items.some((item) => item.blindReviewStatus != null)
  if (!staleInProcess) return counts
  return {
    ...counts,
    in_progress: Math.max(0, counts.in_progress - counts.blind_review),
  }
}

export function adjustPrepTestPoolTotal(
  total: number,
  counts: PrepTestPoolStatusCounts,
  items: PrepTestPoolItem[],
  filter: PrepTestPoolFilter | undefined,
): number {
  const staleInProcess = filter === "in_progress" && items.some((item) => item.blindReviewStatus != null)
  if (!staleInProcess) return total
  return Math.max(0, total - counts.blind_review)
}

export function coercePoolScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function sortAttemptsNewestFirst(attempts: PrepTestPoolAttempt[]): PrepTestPoolAttempt[] {
  return [...attempts].sort(
    (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt) || b.attemptNumber - a.attemptNumber,
  )
}

export function getAttemptDisplayScores(attempt: PrepTestPoolAttempt): {
  test: number | null
  br: number | null
} {
  return {
    test: coercePoolScore(attempt.scaledScore),
    br: coercePoolScore(attempt.blindReviewScaledScore),
  }
}

export function attemptScoreLabel(attempt: PrepTestPoolAttempt): string {
  const { test, br } = getAttemptDisplayScores(attempt)
  if (test != null && br != null) return `${test} · ${br} BR`
  if (test != null) return String(test)
  if (br != null) return `${br} BR`
  return "—"
}

export function poolCardDisplayScore(
  item: Pick<PrepTestPoolItem, "scaledScore" | "blindReviewScaledScore">,
  latestAttempt: PrepTestPoolAttempt | null,
  attempts: PrepTestPoolAttempt[] = [],
): number | null {
  const fromAttempt = latestAttempt ? coercePoolScore(latestAttempt.scaledScore) : null
  if (fromAttempt != null) return fromAttempt
  const fromItem = coercePoolScore(item.scaledScore)
  if (fromItem != null) return fromItem
  for (const attempt of attempts) {
    const score = coercePoolScore(attempt.scaledScore)
    if (score != null) return score
  }
  return coercePoolScore(item.blindReviewScaledScore)
}

export function hydrateAttemptScores(
  item: Pick<PrepTestPoolItem, "scaledScore" | "blindReviewScaledScore">,
  attempts: PrepTestPoolAttempt[],
): PrepTestPoolAttempt[] {
  const itemScaled = coercePoolScore(item.scaledScore)
  const itemBr = coercePoolScore(item.blindReviewScaledScore)
  return attempts.map((attempt, index) => ({
    ...attempt,
    scaledScore: coercePoolScore(attempt.scaledScore) ?? (index === 0 ? itemScaled : null),
    blindReviewScaledScore:
      coercePoolScore(attempt.blindReviewScaledScore) ?? (index === 0 ? itemBr : null),
  }))
}

export function buildPoolHistoryRows(
  item: Pick<
    PrepTestPoolItem,
    "attempts" | "completedAt" | "scaledScore" | "blindReviewScaledScore" | "openPrepTestSessionId" | "id"
  >,
  options: { includeFallback: boolean },
): PrepTestPoolAttempt[] {
  const sorted = hydrateAttemptScores(item, sortAttemptsNewestFirst(item.attempts ?? []))
  if (sorted.length > 0) return sorted
  if (!options.includeFallback) return []
  const scaledScore = coercePoolScore(item.scaledScore)
  const blindReviewScaledScore = coercePoolScore(item.blindReviewScaledScore)
  if (!item.completedAt && scaledScore == null && blindReviewScaledScore == null) return []
  return [
    {
      sessionId: item.openPrepTestSessionId ?? item.id,
      completedAt: item.completedAt ?? new Date(0).toISOString(),
      scaledScore,
      blindReviewScaledScore,
      attemptNumber: 1,
    },
  ]
}
