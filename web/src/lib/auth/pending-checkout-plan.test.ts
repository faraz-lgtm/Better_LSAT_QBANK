import { beforeEach, describe, expect, it } from "vitest"

import {
  clearPendingCheckoutPlan,
  parseSignupPlan,
  readPendingCheckoutPlan,
  resolvePendingCheckoutDestination,
  savePendingCheckoutPlan,
  signupPathForPlan,
} from "./pending-checkout-plan"

describe("pending checkout plan", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("accepts only supported public plan IDs", () => {
    expect(parseSignupPlan("free")).toBe("free")
    expect(parseSignupPlan("monthly")).toBe("monthly")
    expect(parseSignupPlan("three_month")).toBe("three_month")
    expect(parseSignupPlan("six_month")).toBe("six_month")
    expect(parseSignupPlan("yearly")).toBe("yearly")
    expect(parseSignupPlan("twelve_month")).toBeNull()
    expect(parseSignupPlan("3")).toBeNull()
    expect(parseSignupPlan(null)).toBeNull()
  })

  it("persists and clears a validated plan", () => {
    savePendingCheckoutPlan("three_month")
    expect(readPendingCheckoutPlan()).toBe("three_month")

    clearPendingCheckoutPlan()
    expect(readPendingCheckoutPlan()).toBeNull()
  })

  it("routes paid plans to the authenticated checkout handoff", () => {
    savePendingCheckoutPlan("six_month")

    expect(resolvePendingCheckoutDestination("/app")).toBe(
      "/checkout?plan=six_month",
    )
    expect(readPendingCheckoutPlan()).toBe("six_month")
  })

  it("bypasses onboarding for paid intent", () => {
    savePendingCheckoutPlan("monthly")

    expect(resolvePendingCheckoutDestination("/onboarding")).toBe(
      "/checkout?plan=monthly",
    )
    expect(readPendingCheckoutPlan()).toBe("monthly")
  })

  it("keeps free intent in onboarding", () => {
    savePendingCheckoutPlan("free")

    expect(resolvePendingCheckoutDestination("/onboarding")).toBe("/onboarding")
    expect(readPendingCheckoutPlan()).toBe("free")
  })

  it("consumes free intent at the normal post-auth destination", () => {
    savePendingCheckoutPlan("free")

    expect(resolvePendingCheckoutDestination("/app")).toBe("/app")
    expect(readPendingCheckoutPlan()).toBeNull()
  })

  it("builds canonical signup URLs", () => {
    expect(signupPathForPlan("three_month")).toBe(
      "/signup?plan=three_month",
    )
  })
})
