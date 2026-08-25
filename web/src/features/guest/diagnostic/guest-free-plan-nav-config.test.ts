import { describe, expect, it } from "vitest"

import { isFreePlanLockedNavHref } from "./guest-free-plan-nav-config"

describe("isFreePlanLockedNavHref", () => {
  it("keeps Dashboard, Diagnostic, and Diagnostic Results unlocked", () => {
    expect(isFreePlanLockedNavHref("/app")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/")).toBe(false)
    expect(isFreePlanLockedNavHref("/intent")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/diagnostic/results")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/diagnostic/results/mini")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/diagnostic/results/full")).toBe(false)
  })

  it("locks Academy, Prep, and Insights destinations", () => {
    expect(isFreePlanLockedNavHref("/app/prep-course")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/learn/explanations")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/practice/drills")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/practice/sections")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/preptest")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/practice/blind-review")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/analytics")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/analytics/drills")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/analytics/sections")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/analytics/preptests")).toBe(true)
  })
})
