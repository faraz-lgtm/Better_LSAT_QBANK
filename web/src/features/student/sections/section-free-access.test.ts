import { describe, expect, it } from "vitest"

import { shouldLimitFreeSectionAccess } from "./section-free-access"

describe("shouldLimitFreeSectionAccess", () => {
  it("limits when payment is required and core is inactive", () => {
    expect(
      shouldLimitFreeSectionAccess({
        accessState: "PAYMENT_REQUIRED",
        hasActiveCore: false,
      }),
    ).toBe(true)
  })

  it("does not limit when core is active", () => {
    expect(
      shouldLimitFreeSectionAccess({
        accessState: "PAYMENT_REQUIRED",
        hasActiveCore: true,
      }),
    ).toBe(false)
  })

  it("does not limit for full access", () => {
    expect(shouldLimitFreeSectionAccess({ accessState: "FULL_ACCESS" })).toBe(false)
  })
})
