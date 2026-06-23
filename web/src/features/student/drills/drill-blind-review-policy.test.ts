import { describe, expect, it } from "vitest"

import {
  drillSessionSupportsBlindReview,
  isAdaptiveDrillSession,
  isDashboardAdaptiveDrill,
  isDashboardAdaptiveDrillSession,
  isPrepCourseActiveDrillSession,
  isPrepCourseAdaptiveDrillSession,
  showDrillSessionTimer,
} from "@/features/student/drills/drill-blind-review-policy"

describe("drillSessionSupportsBlindReview", () => {
  it("allows blind review for standard and prep-course drills", () => {
    expect(drillSessionSupportsBlindReview({ metadata: { difficulty: "easy" } })).toBe(true)
    expect(drillSessionSupportsBlindReview({ metadata: { source: "prep_course_active_drill" } })).toBe(true)
    expect(drillSessionSupportsBlindReview({ metadata: { source: "prep_course_adaptive_drill" } })).toBe(true)
    expect(
      drillSessionSupportsBlindReview({
        metadata: {
          source: "prep_course_adaptive_drill",
          difficulty: "adaptive",
        },
      }),
    ).toBe(true)
  })

  it("allows blind review for practice drills including adaptive difficulty", () => {
    expect(drillSessionSupportsBlindReview({ metadata: { difficulty: "adaptive" } })).toBe(true)
    expect(drillSessionSupportsBlindReview({ metadata: { difficulty: "easy" } })).toBe(true)
  })

  it("disables blind review only for dashboard adaptive drills", () => {
    expect(
      drillSessionSupportsBlindReview({
        metadata: { source: "dashboard_adaptive_drill" },
      }),
    ).toBe(false)
    expect(drillSessionSupportsBlindReview({ dashboardAdaptiveEntry: true })).toBe(false)
    expect(
      isDashboardAdaptiveDrill({
        metadata: { difficulty: "adaptive" },
        dashboardAdaptiveEntry: true,
      }),
    ).toBe(true)
    expect(isDashboardAdaptiveDrillSession({ source: "dashboard_adaptive_drill" })).toBe(true)
    expect(isDashboardAdaptiveDrillSession({ difficulty: "adaptive" })).toBe(false)
  })

  it("identifies adaptive drill sessions for dashboard and prep course sources", () => {
    expect(
      isAdaptiveDrillSession({
        metadata: { source: "dashboard_adaptive_drill" },
      }),
    ).toBe(true)
    expect(
      isAdaptiveDrillSession({
        metadata: { source: "prep_course_adaptive_drill" },
      }),
    ).toBe(true)
    expect(isPrepCourseAdaptiveDrillSession({ source: "prep_course_adaptive_drill" })).toBe(true)
    expect(
      isAdaptiveDrillSession({
        metadata: { source: "prep_course_active_drill" },
      }),
    ).toBe(false)
    expect(
      isAdaptiveDrillSession({
        metadata: { difficulty: "adaptive" },
      }),
    ).toBe(false)
  })

  it("hides session timer for adaptive and prep-course active drills", () => {
    expect(
      showDrillSessionTimer({
        metadata: { source: "dashboard_adaptive_drill" },
      }),
    ).toBe(false)
    expect(
      showDrillSessionTimer({
        metadata: { source: "prep_course_adaptive_drill" },
      }),
    ).toBe(false)
    expect(
      showDrillSessionTimer({
        metadata: { source: "prep_course_active_drill" },
      }),
    ).toBe(false)
    expect(isPrepCourseActiveDrillSession({ source: "prep_course_active_drill" })).toBe(true)
    expect(showDrillSessionTimer({ metadata: { difficulty: "easy" } })).toBe(true)
  })
})
