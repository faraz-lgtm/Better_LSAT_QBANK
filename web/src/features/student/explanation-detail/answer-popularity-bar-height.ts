/** Figma AnswerPopularity track is 200px; fill heights use a 2.75px-per-percent scale (72% → 198px). */
export const ANSWER_POPULARITY_TRACK_HEIGHT = 200
export const ANSWER_POPULARITY_FILL_SCALE = 2.75
export const ANSWER_POPULARITY_FILL_MIN = 8
export const ANSWER_POPULARITY_FILL_MAX = ANSWER_POPULARITY_TRACK_HEIGHT - 2

export function answerPopularityBarFillHeight(pct: number, trackHeight = ANSWER_POPULARITY_TRACK_HEIGHT): number {
  if (pct <= 0) return 0
  const fillMax = trackHeight - 2
  const scale = fillMax / 72
  const raw = pct * scale
  return Math.min(fillMax, Math.max(ANSWER_POPULARITY_FILL_MIN, raw))
}
