import { describe, expect, it } from "vitest"

import {
  isActiveDrillResultsQuery,
  resolveDisplayedActiveDrillAttempt,
  withActiveDrillResultsQuery,
} from "@/features/prep-course/lib/active-drill-results-query"

const attempt = { sessionId: "s1" }

describe("active drill results query", () => {
  it("flags the post-submit results view", () => {
    expect(isActiveDrillResultsQuery("?results=1")).toBe(true)
    expect(isActiveDrillResultsQuery("results=1")).toBe(true)
    expect(isActiveDrillResultsQuery("")).toBe(false)
    expect(isActiveDrillResultsQuery("?foo=1")).toBe(false)
  })

  it("appends results=1 when returning to the course lesson", () => {
    expect(withActiveDrillResultsQuery("/app/prep-course/core/active-drill-1")).toBe(
      "/app/prep-course/core/active-drill-1?results=1",
    )
    expect(withActiveDrillResultsQuery("/app/prep-course/core/active-drill-1?tab=notes")).toBe(
      "/app/prep-course/core/active-drill-1?tab=notes&results=1",
    )
  })

  it("hides a stored active-drill attempt until after submit", () => {
    expect(resolveDisplayedActiveDrillAttempt("active_drill", attempt, "")).toBeNull()
    expect(resolveDisplayedActiveDrillAttempt("active_drill", attempt, "?results=1")).toEqual(attempt)
  })

  it("still shows adaptive drill results from a stored attempt", () => {
    expect(resolveDisplayedActiveDrillAttempt("adaptive_drill", attempt, "")).toEqual(attempt)
  })

  it("does not hide a stored attempt for other lesson types", () => {
    expect(resolveDisplayedActiveDrillAttempt("rep_work", attempt, "")).toEqual(attempt)
  })
})
