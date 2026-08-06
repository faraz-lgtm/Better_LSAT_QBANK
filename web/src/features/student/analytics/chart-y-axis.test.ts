import { describe, expect, it } from "vitest"

import {
  LSAT_SCALED_Y_AXIS_LABELS,
  PERCENT_Y_AXIS_LABELS,
  buildChartYAxisLabels,
  resolveRawScoreAxisMax,
} from "./chart-y-axis"

describe("buildChartYAxisLabels", () => {
  it("builds descending ticks for a raw question-count domain", () => {
    expect(buildChartYAxisLabels(101, 0)).toEqual([101, 81, 61, 40, 20, 0])
    expect(buildChartYAxisLabels(25, 0)).toEqual([25, 20, 15, 10, 5, 0])
  })

  it("builds the LSAT scaled domain from 180 to 120", () => {
    expect(LSAT_SCALED_Y_AXIS_LABELS).toEqual([180, 168, 156, 144, 132, 120])
  })

  it("builds a 100 to 0 percent domain", () => {
    expect(PERCENT_Y_AXIS_LABELS).toEqual([100, 80, 60, 40, 20, 0])
  })
})

describe("resolveRawScoreAxisMax", () => {
  it("uses the largest observed question count", () => {
    expect(resolveRawScoreAxisMax([75, 101, 98])).toBe(101)
  })

  it("falls back when empty", () => {
    expect(resolveRawScoreAxisMax([])).toBe(101)
  })
})
