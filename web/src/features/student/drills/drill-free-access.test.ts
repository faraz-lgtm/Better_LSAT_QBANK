import { describe, expect, it } from "vitest"

import { shouldLimitFreeDrillAccess } from "./drill-free-access"

describe("shouldLimitFreeDrillAccess", () => {
  it("limits when payment is required and core is inactive", () => {
    expect(
      shouldLimitFreeDrillAccess({
        accessState: "PAYMENT_REQUIRED",
        hasActiveCore: false,
      }),
    ).toBe(true)
  })

  it("does not limit when core is active", () => {
    expect(
      shouldLimitFreeDrillAccess({
        accessState: "PAYMENT_REQUIRED",
        hasActiveCore: true,
      }),
    ).toBe(false)
  })

  it("does not limit for full access", () => {
    expect(shouldLimitFreeDrillAccess({ accessState: "FULL_ACCESS" })).toBe(false)
  })
})
