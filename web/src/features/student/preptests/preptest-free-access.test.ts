import { describe, expect, it } from "vitest"

import {
  FREE_PREPTEST_ALLOWANCE,
  isFreePrepTestUnlocked,
  selectFreePrepTestIds,
  shouldLimitFreePrepTestAccess,
} from "@/features/student/preptests/preptest-free-access"

describe("preptest-free-access", () => {
  it("keeps the free PrepTest allowance at zero (all locked)", () => {
    expect(FREE_PREPTEST_ALLOWANCE).toBe(0)
    const ids = selectFreePrepTestIds([
      { id: "a", prepTestNumber: "116" },
      { id: "b", prepTestNumber: "121" },
      { id: "c", prepTestNumber: "119" },
    ])
    expect(ids.size).toBe(0)
  })

  it("treats missing or empty free ids as locked", () => {
    expect(isFreePrepTestUnlocked("b", null)).toBe(false)
    expect(isFreePrepTestUnlocked("b", new Set())).toBe(false)
    expect(isFreePrepTestUnlocked("b", new Set(["b"]))).toBe(true)
  })

  it("limits access only for unpaid free-plan users", () => {
    expect(shouldLimitFreePrepTestAccess({ accessState: "PAYMENT_REQUIRED" })).toBe(true)
    expect(
      shouldLimitFreePrepTestAccess({ accessState: "PAYMENT_REQUIRED", hasActiveCore: true }),
    ).toBe(false)
    expect(shouldLimitFreePrepTestAccess({ accessState: "FULL_ACCESS" })).toBe(false)
  })
})
