/**
 * LSAT raw→scaled curve used for diagnostic score estimates.
 * Source: PrepTest / Form Apr 2025 (`scaled_score/Test_159_Apr2025.csv`) — 77 scored questions.
 *
 * Section & mini diagnostics project misses onto a full test:
 *   fullIncorrect ≈ round(incorrect / sectionSize × 77)
 *   raw = 77 − fullIncorrect → scaled 120–180
 */

/** Index = raw correct count (0–77). */
export const LSAT_RAW_TO_SCALED_APR2025: ReadonlyArray<number> = [
  120, 120, 120, 120, 120, 120, 120, 120, 120, 120, // 0–9
  120, 120, 120, 120, 120, 120, 122, 125, 127, 128, // 10–19
  130, 131, 133, 134, 135, 136, 137, 138, 139, 140, // 20–29
  141, 142, 143, 144, 144, 145, 146, 147, 148, 148, // 30–39
  149, 150, 151, 151, 152, 153, 153, 154, 155, 156, // 40–49
  156, 157, 158, 158, 159, 160, 160, 161, 162, 162, // 50–59
  163, 164, 164, 165, 166, 167, 168, 169, 169, 170, // 60–69
  171, 173, 174, 175, 177, 179, 180, 180, // 70–77
]

export const LSAT_DIAGNOSTIC_SCORED_QUESTION_COUNT = 77

export function scaledScoreForRaw(rawScore: number): number {
  const maxRaw = LSAT_RAW_TO_SCALED_APR2025.length - 1
  const clamped = Math.min(Math.max(Math.round(rawScore), 0), maxRaw)
  return LSAT_RAW_TO_SCALED_APR2025[clamped]!
}

/** Project section/mini misses onto a full scored LSAT, then convert. */
export function scaledScoreForIncorrectOnSection(
  incorrectCount: number,
  sectionQuestionCount: number,
): number {
  if (sectionQuestionCount <= 0) return 120
  const incorrect = Math.min(Math.max(Math.floor(incorrectCount), 0), sectionQuestionCount)
  const fullIncorrect = Math.round(
    (incorrect / sectionQuestionCount) * LSAT_DIAGNOSTIC_SCORED_QUESTION_COUNT,
  )
  const raw = LSAT_DIAGNOSTIC_SCORED_QUESTION_COUNT - fullIncorrect
  return scaledScoreForRaw(raw)
}

/**
 * Likely scaled band for a given miss count.
 * Band edges come from ±1 miss at section size (honest uncertainty for short diagnostics).
 */
export function scaledRangeForIncorrectOnSection(
  incorrectCount: number,
  sectionQuestionCount: number,
): { scaledLow: number; scaledHigh: number } {
  const incorrect = Math.min(Math.max(Math.floor(incorrectCount), 0), sectionQuestionCount)
  const mid = scaledScoreForIncorrectOnSection(incorrect, sectionQuestionCount)
  const lo = scaledScoreForIncorrectOnSection(
    Math.min(sectionQuestionCount, incorrect + 1),
    sectionQuestionCount,
  )
  const hi = scaledScoreForIncorrectOnSection(Math.max(0, incorrect - 1), sectionQuestionCount)
  let scaledLow = Math.min(mid, lo, hi)
  let scaledHigh = Math.max(mid, lo, hi)

  // Collapsed floor/ceiling → keep a small display band like other marketing ranges.
  if (scaledLow === scaledHigh) {
    if (scaledLow <= 120) {
      scaledLow = 120
      scaledHigh = 124
    } else if (scaledHigh >= 180) {
      scaledLow = 177
      scaledHigh = 180
    } else {
      scaledLow = Math.max(120, scaledLow - 2)
      scaledHigh = Math.min(180, scaledHigh + 2)
    }
  }

  return { scaledLow, scaledHigh }
}
