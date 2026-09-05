/** Unique users (latest answer per user) required before showing platform popularity. */
export const MIN_PLATFORM_ANSWER_SAMPLE = 5

export const NOT_ENOUGH_ANSWERS_YET = 'Not enough answers yet'

export function platformAnswerSampleSize(rows: readonly { count: number }[]): number {
  let total = 0
  for (const row of rows) {
    if (typeof row.count === 'number' && Number.isFinite(row.count)) total += row.count
  }
  return total
}

export function hasEnoughPlatformAnswerSample(sampleSize: number): boolean {
  return sampleSize >= MIN_PLATFORM_ANSWER_SAMPLE
}
