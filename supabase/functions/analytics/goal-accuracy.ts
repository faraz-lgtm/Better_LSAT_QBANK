/**
 * Option B: approximate goal accuracy from the user's LSAT target score.
 * Linear curve: 50% at 120 → 98% at 180 (≈86% at 165, matching common 7Sage goals).
 * Per-tag goals are then adjusted by question difficulty so a 180 target does not
 * show the same Goal% on every tag.
 */

export const LSAT_SCORE_MIN = 120
export const LSAT_SCORE_MAX = 180
export const GOAL_ACCURACY_AT_MIN = 50
export const GOAL_ACCURACY_AT_MAX = 98
/** Floor/ceiling after difficulty adjustment. */
export const GOAL_ACCURACY_CLAMP_MIN = 45
export const GOAL_ACCURACY_CLAMP_MAX = 99
/**
 * Percentage-point shift from medium (difficulty 3).
 * 1 Easiest → +8, 2 Easy → +4, 3 Medium → 0, 4 Hard → −6, 5 Hardest → −12
 */
export const DIFFICULTY_GOAL_OFFSET: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 8,
  2: 4,
  3: 0,
  4: -6,
  5: -12,
}
/** Min typed attempts before goal/priority unlock for a tag. */
export const MIN_ATTEMPTS_TO_UNLOCK_PRIORITY = 3

export type PriorityTier = 'highest' | 'high' | 'medium' | 'low'

export function clampLsatScore(score: number): number {
  if (!Number.isFinite(score)) return LSAT_SCORE_MIN
  return Math.max(LSAT_SCORE_MIN, Math.min(LSAT_SCORE_MAX, Math.round(score)))
}

/** Expected overall accuracy % for scorers near `goalScore`. */
export function goalAccuracyFromScore(goalScore: number): number {
  const score = clampLsatScore(goalScore)
  const t = (score - LSAT_SCORE_MIN) / (LSAT_SCORE_MAX - LSAT_SCORE_MIN)
  const pct = GOAL_ACCURACY_AT_MIN + t * (GOAL_ACCURACY_AT_MAX - GOAL_ACCURACY_AT_MIN)
  return Math.round(pct * 10) / 10
}

function clampDifficulty(difficulty: number | null | undefined): 1 | 2 | 3 | 4 | 5 | null {
  if (difficulty == null || !Number.isFinite(difficulty)) return null
  const rounded = Math.round(difficulty)
  if (rounded <= 1) return 1
  if (rounded === 2) return 2
  if (rounded === 3) return 3
  if (rounded === 4) return 4
  return 5
}

/**
 * Adjust score-derived goal accuracy by tag difficulty.
 * Harder tags get a lower Goal% (even top scorers miss more hard items).
 * When difficulty is unknown, returns the base goal unchanged.
 */
export function adjustGoalAccuracyByDifficulty(
  baseGoalPct: number,
  difficulty: number | null | undefined,
): number {
  const level = clampDifficulty(difficulty)
  const offset = level == null ? 0 : DIFFICULTY_GOAL_OFFSET[level]
  const adjusted = baseGoalPct + offset
  const clamped = Math.max(
    GOAL_ACCURACY_CLAMP_MIN,
    Math.min(GOAL_ACCURACY_CLAMP_MAX, adjusted),
  )
  return Math.round(clamped * 10) / 10
}

/**
 * Extra correct answers needed per PrepTest to close the accuracy gap for this tag.
 * gapPct is in percentage points (e.g. 16 for 70% → 86%).
 */
export function extraCorrectNeededPerTest(
  gapPct: number | null,
  avgQuestionsPerTest: number | null,
): number | null {
  if (gapPct == null || avgQuestionsPerTest == null || !(avgQuestionsPerTest > 0)) return null
  if (gapPct <= 0) return 0
  return Math.round((gapPct / 100) * avgQuestionsPerTest * 10) / 10
}

type Rankable = {
  priorityScore: number | null
  /** When false, excluded from quartile ranking (insufficient data / zero avg). */
  rankable: boolean
}

/**
 * Bucket rankable tags into relative quartiles by priority_score
 * (= gap_pct × avg_questions_per_test). Avoids absolute cutoffs that
 * cluster everything into one tier for extreme goal scores.
 */
export function assignRelativePriorityTiers<T extends Rankable>(
  items: T[],
): Array<T & { priorityTier: PriorityTier | null }> {
  const rankableIdx: number[] = []
  for (let i = 0; i < items.length; i++) {
    if (items[i]!.rankable && items[i]!.priorityScore != null) rankableIdx.push(i)
  }

  rankableIdx.sort((a, b) => {
    const sa = items[a]!.priorityScore ?? 0
    const sb = items[b]!.priorityScore ?? 0
    return sb - sa
  })

  const n = rankableIdx.length
  const tierByIndex = new Map<number, PriorityTier>()
  for (let rank = 0; rank < n; rank++) {
    const idx = rankableIdx[rank]!
    const percentileFromTop = n <= 1 ? 0 : rank / n
    let tier: PriorityTier
    if (percentileFromTop < 0.25) tier = 'highest'
    else if (percentileFromTop < 0.5) tier = 'high'
    else if (percentileFromTop < 0.75) tier = 'medium'
    else tier = 'low'
    tierByIndex.set(idx, tier)
  }

  return items.map((item, i) => ({
    ...item,
    priorityTier: tierByIndex.get(i) ?? null,
  }))
}

/** Map new relative tiers onto legacy high/medium/low for older UI consumers. */
export function legacyPriorityLevel(
  tier: PriorityTier | null,
): 'high' | 'medium' | 'low' {
  if (tier === 'highest' || tier === 'high') return 'high'
  if (tier === 'medium') return 'medium'
  return 'low'
}
