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
    writeGuestPremiumAccount("live")
    expect(readGuestPremiumAccount()?.planId).toBe("live")
  })

  it("clears premium account state", () => {
    writeGuestPremiumAccount("core")
    clearGuestPremiumAccount()
    expect(readGuestPremiumAccount()).toBeNull()
  })
})
