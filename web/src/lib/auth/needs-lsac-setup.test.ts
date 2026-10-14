import { describe, expect, it } from "vitest"

import { needsLsacSetupStep } from "@/lib/auth/needs-lsac-setup"
import type { UserEntitlement } from "@/lib/api/users"

const base: UserEntitlement = {
  isAuthenticated: true,
  isLsacLinked: false,
  isLsacEligible: false,
  hasActiveCore: true,
  accessState: "FULL_ACCESS",
}

describe("needsLsacSetupStep", () => {
  it("is false when entitlement is missing", () => {
    expect(needsLsacSetupStep(null)).toBe(false)
    expect(needsLsacSetupStep(undefined)).toBe(false)
  })

  it("is false when payment is still required", () => {
    expect(
      needsLsacSetupStep({
        ...base,
        hasActiveCore: false,
        accessState: "PAYMENT_REQUIRED",
      }),
    ).toBe(false)
  })

  it("is true when subscribed but not LawHub eligible", () => {
    expect(needsLsacSetupStep(base)).toBe(true)
    expect(
      needsLsacSetupStep({
        ...base,
        isLsacLinked: true,
        accessState: "LSAC_REQUIRED",
      }),
    ).toBe(true)
  })

  it("is false when LawHub eligible", () => {
    expect(
      needsLsacSetupStep({
        ...base,
        isLsacLinked: true,
        isLsacEligible: true,
        accessState: "FULL_ACCESS",
      }),
    ).toBe(false)
  })
})
