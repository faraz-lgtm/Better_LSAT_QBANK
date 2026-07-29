import { describe, expect, it } from "vitest"

import { resolveStudentShellVariant } from "./student-shell-plan-variant"

describe("resolveStudentShellVariant", () => {
  it("keeps the premium shell for paid students on every route", () => {
    expect(resolveStudentShellVariant({ accessState: "FULL_ACCESS" })).toBe("premium")
    expect(resolveStudentShellVariant({ accessState: "LSAC_REQUIRED" })).toBe("premium")
  })

  it("uses the free-plan shell when billing says payment is required", () => {
    expect(resolveStudentShellVariant({ accessState: "PAYMENT_REQUIRED" })).toBe("free-plan")
  })

  it("keeps the premium shell while entitlement is unknown so paid students never see padlocks", () => {
    expect(resolveStudentShellVariant({ accessState: null })).toBe("premium")
  })

  it("treats the guest premium preview account as premium", () => {
    expect(
      resolveStudentShellVariant({ accessState: "PAYMENT_REQUIRED", hasGuestPremiumAccount: true }),
    ).toBe("premium")
  })
})
