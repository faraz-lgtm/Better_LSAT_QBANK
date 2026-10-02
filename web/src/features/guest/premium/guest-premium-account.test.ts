import { describe, expect, it, beforeEach } from "vitest"

import {
  clearGuestPremiumAccount,
  readGuestPremiumAccount,
  writeGuestPremiumAccount,
} from "@/features/guest/premium/guest-premium-account"

describe("guest premium account", () => {
  beforeEach(() => {
    clearGuestPremiumAccount()
  })

  it("persists selected plan in session storage", () => {
    writeGuestPremiumAccount("three_month")
    expect(readGuestPremiumAccount()?.planId).toBe("three_month")
  })

  it("clears premium account state", () => {
    writeGuestPremiumAccount("monthly")
    clearGuestPremiumAccount()
    expect(readGuestPremiumAccount()).toBeNull()
  })
})
