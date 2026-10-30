import { describe, expect, it } from "vitest"

import { shouldLimitFreeExplanationAccess } from "./explanation-free-access"

describe("shouldLimitFreeExplanationAccess", () => {
  it("limits when payment is required and core is inactive", () => {
    expect(
      shouldLimitFreeExplanationAccess({
        accessState: "PAYMENT_REQUIRED",
        hasActiveCore: false,
      }),
    ).toBe(true)
  })

  it("does not limit paid / eligible users", () => {
    expect(
      shouldLimitFreeExplanationAccess({
        accessState: "PAYMENT_REQUIRED",
        hasActiveCore: true,
      }),
    ).toBe(false)
    expect(
      shouldLimitFreeExplanationAccess({
        accessState: "FULL_ACCESS",
        hasActiveCore: false,
      }),
    ).toBe(false)
  })
})
