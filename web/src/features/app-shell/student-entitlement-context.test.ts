import { describe, expect, it } from "vitest"

import { isLsacContentPath } from "./student-entitlement-context"

describe("isLsacContentPath", () => {
  it("keeps dashboard and diagnostic open", () => {
    expect(isLsacContentPath("/app")).toBe(false)
    expect(isLsacContentPath("/app/")).toBe(false)
    expect(isLsacContentPath("/app/diagnostic/results")).toBe(false)
  })

  it("locks academy, prep, and insights routes", () => {
    expect(isLsacContentPath("/app/preptest")).toBe(true)
    expect(isLsacContentPath("/app/preptest/pt-1")).toBe(true)
    expect(isLsacContentPath("/app/practice/drills")).toBe(true)
    expect(isLsacContentPath("/app/practice/sections")).toBe(true)
    expect(isLsacContentPath("/app/practice/blind-review")).toBe(true)
    expect(isLsacContentPath("/app/learn/explanations")).toBe(true)
    expect(isLsacContentPath("/app/prep-course")).toBe(true)
    expect(isLsacContentPath("/app/analytics")).toBe(true)
    expect(isLsacContentPath("/app/analytics/preptests")).toBe(true)
  })
})
