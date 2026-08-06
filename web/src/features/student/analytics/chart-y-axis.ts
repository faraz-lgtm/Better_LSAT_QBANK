/**
 * Shared descending Y-axis ticks for analytics score charts.
 * Prefer real score domains (question count, LSAT 120–180, or 0–100%) over fake 20–100 scales.
 */

const DEFAULT_PREPTEST_QUESTION_COUNT = 101
const LSAT_SCALED_MIN = 120
const LSAT_SCALED_MAX = 180

function buildChartYAxisLabels(maxValue: number, minValue = 0, tickCount = 6): number[] {
  const max = Math.max(minValue + 1, Math.ceil(maxValue))
  const min = Math.min(minValue, max - 1)
  const steps = Math.max(2, tickCount)
  const labels: number[] = []
  for (let i = 0; i < steps; i += 1) {
    labels.push(Math.round(max - ((max - min) * i) / (steps - 1)))
  }
  labels[0] = max
  labels[labels.length - 1] = min
  return labels
}

function resolveRawScoreAxisMax(questionCounts: number[], fallback = DEFAULT_PREPTEST_QUESTION_COUNT): number {
  const observed = questionCounts.filter((n) => Number.isFinite(n) && n > 0)
  return observed.length > 0 ? Math.max(...observed) : fallback
}

const LSAT_SCALED_Y_AXIS_LABELS = buildChartYAxisLabels(LSAT_SCALED_MAX, LSAT_SCALED_MIN)
const PERCENT_Y_AXIS_LABELS = buildChartYAxisLabels(100, 0)

export {
  DEFAULT_PREPTEST_QUESTION_COUNT,
  LSAT_SCALED_MAX,
  LSAT_SCALED_MIN,
  LSAT_SCALED_Y_AXIS_LABELS,
  PERCENT_Y_AXIS_LABELS,
  buildChartYAxisLabels,
  resolveRawScoreAxisMax,
}
