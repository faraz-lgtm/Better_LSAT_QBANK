import { describe, expect, it } from "vitest"

import { isInsightsBrowsePath } from "./analytics-routes"

describe("isInsightsBrowsePath", () => {
  it("allows the four Insights browse pages", () => {
    expect(isInsightsBrowsePath("/app/analytics")).toBe(true)
    expect(isInsightsBrowsePath("/app/analytics/")).toBe(true)
    expect(isInsightsBrowsePath("/app/analytics/drills")).toBe(true)
    expect(isInsightsBrowsePath("/app/analytics/sections")).toBe(true)
    expect(isInsightsBrowsePath("/app/analytics/preptests")).toBe(true)
  })

  it("rejects nested results and review routes", () => {
    expect(isInsightsBrowsePath("/app/analytics/drills/results/abc")).toBe(false)
    expect(isInsightsBrowsePath("/app/analytics/preptests/results/pt-1")).toBe(false)
    expect(isInsightsBrowsePath("/app/analytics/review/qt-1")).toBe(false)
  })
})
