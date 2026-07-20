import { describe, expect, it } from "vitest"

import { isLsacContentPath, isLsacLockedNavItem } from "./student-entitlement-context"

describe("isLsacContentPath", () => {
  it("keeps dashboard, diagnostic, and prep course open", () => {
    expect(isLsacContentPath("/app")).toBe(false)
    expect(isLsacContentPath("/app/")).toBe(false)
    expect(isLsacContentPath("/app/diagnostic/results")).toBe(false)
    expect(isLsacContentPath("/app/prep-course")).toBe(false)
    expect(isLsacContentPath("/app/prep-course/kickoff")).toBe(false)
  })

  it("locks LSAC pool routes (explanations, prep, insights)", () => {
    expect(isLsacContentPath("/app/preptest")).toBe(true)
    expect(isLsacContentPath("/app/preptest/pt-1")).toBe(true)
    expect(isLsacContentPath("/app/practice/drills")).toBe(true)
    expect(isLsacContentPath("/app/practice/sections")).toBe(true)
    expect(isLsacContentPath("/app/practice/blind-review")).toBe(true)
    expect(isLsacContentPath("/app/learn/explanations")).toBe(true)
    expect(isLsacContentPath("/app/analytics")).toBe(true)
    expect(isLsacContentPath("/app/analytics/preptests")).toBe(true)
  })
})

describe("isLsacLockedNavItem", () => {
  it("keeps Prep Course unlocked in the sidebar", () => {
    expect(isLsacLockedNavItem("/app/prep-course")).toBe(false)
  })

  it("locks other academy and prep nav items", () => {
    expect(isLsacLockedNavItem("/app/learn/explanations")).toBe(true)
    expect(isLsacLockedNavItem("/app/preptest")).toBe(true)
    expect(isLsacLockedNavItem("/app/practice/drills")).toBe(true)
  })
})
