/** LSAT scaled score bounds used for goal accuracy on Insights. */
export const LSAT_GOAL_SCORE_MIN = 120
export const LSAT_GOAL_SCORE_MAX = 180

export const LSAT_GOAL_SCORE_OPTIONS: Array<{ label: string; value: string }> = Array.from(
  { length: LSAT_GOAL_SCORE_MAX - LSAT_GOAL_SCORE_MIN + 1 },
  (_, i) => {
    const score = LSAT_GOAL_SCORE_MIN + i
    return { label: String(score), value: String(score) }
  },
)

export function parseLsatGoalScore(raw: string): number | null {
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return null
  if (n < LSAT_GOAL_SCORE_MIN || n > LSAT_GOAL_SCORE_MAX) return null
  return n
}
