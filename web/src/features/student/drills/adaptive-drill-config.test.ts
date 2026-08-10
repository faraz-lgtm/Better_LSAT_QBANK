import { describe, expect, it } from "vitest"

import {
  DASHBOARD_ADAPTIVE_DRILL_QUESTION_COUNT,
  PREP_COURSE_ADAPTIVE_DRILL_QUESTION_COUNT,
} from "@/features/student/drills/adaptive-drill-config"

describe("adaptive-drill-config", () => {
  it("keeps dashboard and prep-course adaptive drills at a minimum of 5 questions", () => {
    expect(DASHBOARD_ADAPTIVE_DRILL_QUESTION_COUNT).toBe(5)
    expect(PREP_COURSE_ADAPTIVE_DRILL_QUESTION_COUNT).toBe(5)
    expect(DASHBOARD_ADAPTIVE_DRILL_QUESTION_COUNT).toBeGreaterThanOrEqual(5)
  })
})
