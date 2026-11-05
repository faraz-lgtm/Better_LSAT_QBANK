import { describe, expect, it } from "vitest"

import { shouldLimitFreeAnalyticsAccess } from "./analytics-free-access"

describe("shouldLimitFreeAnalyticsAccess", () => {
  it("limits payment-required users without core", () => {
    expect(
      shouldLimitFreeAnalyticsAccess({
        accessState: "PAYMENT_REQUIRED",
        hasActiveCore: false,
      }),
    ).toBe(true)
  })

  it("does not limit when core is active", () => {
    expect(
      shouldLimitFreeAnalyticsAccess({
        accessState: "PAYMENT_REQUIRED",
        hasActiveCore: true,
      }),
    ).toBe(false)
  })

  it("does not limit full-access users", () => {
    expect(shouldLimitFreeAnalyticsAccess({ accessState: "FULL_ACCESS" })).toBe(false)
  })
})
