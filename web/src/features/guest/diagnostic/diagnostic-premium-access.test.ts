import { describe, expect, it, vi } from "vitest"

import { entitlementUnlocksDiagnosticResults } from "@/features/guest/diagnostic/diagnostic-premium-access"

vi.mock("@/features/guest/premium/guest-premium-account", () => ({
  hasGuestPremiumAccess: () => mockGuest.hasAccess,
}))

const mockGuest = { hasAccess: false }

describe("entitlementUnlocksDiagnosticResults", () => {
  it("unlocks billed core, full access, and LSAC-setup students", () => {
    mockGuest.hasAccess = false
    expect(
      entitlementUnlocksDiagnosticResults({ hasActiveCore: true, accessState: "FULL_ACCESS" }),
    ).toBe(true)
    expect(
      entitlementUnlocksDiagnosticResults({ hasActiveCore: false, accessState: "FULL_ACCESS" }),
    ).toBe(true)
    expect(
      entitlementUnlocksDiagnosticResults({ hasActiveCore: false, accessState: "LSAC_REQUIRED" }),
    ).toBe(true)
  })

  it("keeps payment-required and unauthenticated students locked", () => {
    mockGuest.hasAccess = false
    expect(
      entitlementUnlocksDiagnosticResults({ hasActiveCore: false, accessState: "PAYMENT_REQUIRED" }),
    ).toBe(false)
    expect(
      entitlementUnlocksDiagnosticResults({ hasActiveCore: false, accessState: "AUTH_REQUIRED" }),
    ).toBe(false)
    expect(entitlementUnlocksDiagnosticResults(null)).toBe(false)
  })

  it("unlocks guest premium previews even without a billed entitlement", () => {
    mockGuest.hasAccess = true
    expect(
      entitlementUnlocksDiagnosticResults({ hasActiveCore: false, accessState: "PAYMENT_REQUIRED" }),
    ).toBe(true)
    expect(entitlementUnlocksDiagnosticResults(null)).toBe(true)
  })
})
