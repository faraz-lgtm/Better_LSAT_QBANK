import { describe, expect, it } from "vitest"

import {
  drillSessionSupportsBlindReview,
  isDashboardAdaptiveDrillSession,
} from "@/features/student/drills/drill-blind-review-policy"

describe("drillSessionSupportsBlindReview", () => {
  it("allows blind review for standard and prep-course drills", () => {
    expect(drillSessionSupportsBlindReview({ difficulty: "easy" })).toBe(true)
    expect(drillSessionSupportsBlindReview({ source: "prep_course_active_drill" })).toBe(true)
    expect(drillSessionSupportsBlindReview({ source: "prep_course_adaptive_drill" })).toBe(true)
    expect(
      drillSessionSupportsBlindReview({
        source: "prep_course_adaptive_drill",
        difficulty: "adaptive",
      }),
    ).toBe(true)
  })

  it("disables blind review only for dashboard adaptive drills", () => {
    expect(drillSessionSupportsBlindReview({ difficulty: "adaptive" })).toBe(false)
    expect(isDashboardAdaptiveDrillSession({ difficulty: "adaptive" })).toBe(true)
    expect(isDashboardAdaptiveDrillSession({ source: "prep_course_adaptive_drill" })).toBe(false)
  })
})
