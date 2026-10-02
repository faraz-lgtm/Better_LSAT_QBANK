import { describe, expect, it } from "vitest"

import {
  DEFAULT_DRILL_SCORE_TAB,
  DEFAULT_PREPTEST_SCORE_TAB,
  DEFAULT_SECTION_SCORE_TAB,
} from "@/features/student/analytics/score-chart-defaults"

describe("analytics score chart defaults", () => {
  it("opens drills score progress on percent score, not PT equivalent", () => {
    expect(DEFAULT_DRILL_SCORE_TAB).toBe("percent")
  })

  it("opens section score progress on raw score, not PT equivalent", () => {
    expect(DEFAULT_SECTION_SCORE_TAB).toBe("raw")
  })

  it("opens PrepTest score progress on scaled PT score, not raw", () => {
    expect(DEFAULT_PREPTEST_SCORE_TAB).toBe("scaled")
  })
})
