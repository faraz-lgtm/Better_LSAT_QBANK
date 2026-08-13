import { describe, expect, it } from "vitest"

import { practiceSessionResultsPath } from "@/features/student/analytics/analytics-results-paths"

describe("practiceSessionResultsPath", () => {
  it("opens drill results, not PrepTest results", () => {
    expect(practiceSessionResultsPath("drill-1")).toBe("/app/practice/results/drill-1")
    expect(practiceSessionResultsPath("drill-1")).not.toContain("analytics/preptests/results")
  })

  it("adds section source when requested", () => {
    expect(practiceSessionResultsPath("sec-1", { source: "section" })).toBe(
      "/app/practice/results/sec-1?source=section",
    )
  })
})
