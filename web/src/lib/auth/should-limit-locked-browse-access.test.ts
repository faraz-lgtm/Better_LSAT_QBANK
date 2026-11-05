import { describe, expect, it } from "vitest"

import { shouldLimitLockedBrowseAccess } from "./should-limit-locked-browse-access"

describe("shouldLimitLockedBrowseAccess", () => {
  it("limits free-plan users", () => {
    expect(
      shouldLimitLockedBrowseAccess({
        accessState: "PAYMENT_REQUIRED",
        hasActiveCore: false,
      }),
    ).toBe(true)
  })

  it("limits premium users who still need LSAC setup", () => {
    expect(
      shouldLimitLockedBrowseAccess({
        accessState: "LSAC_REQUIRED",
        hasActiveCore: true,
        isLsacSetupRequired: true,
      }),
    ).toBe(true)
  })

  it("does not limit fully entitled users", () => {
    expect(
      shouldLimitLockedBrowseAccess({
        accessState: "FULL_ACCESS",
        hasActiveCore: true,
        isLsacSetupRequired: false,
      }),
    ).toBe(false)
  })
})
