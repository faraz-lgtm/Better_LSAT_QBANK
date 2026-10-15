import { beforeEach, describe, expect, it } from "vitest"

import {
  checkoutPathForPlan,
  clearPendingCheckoutPlan,
  DEFAULT_CHECKOUT_SUCCESS_PATH,
  parseCheckoutSuccessPathParam,
  parseSignupPlan,
  readPendingCheckoutPlan,
  resolveCheckoutSuccessPath,
  resolvePendingCheckoutDestination,
  savePendingCheckoutPlan,
  signupPathForPlan,
  signupPathFromCheckoutSearch,
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

  it("builds checkout handoff URLs with optional LawHub flag", () => {
    expect(checkoutPathForPlan("three_month")).toBe("/checkout?plan=three_month")
    expect(checkoutPathForPlan("monthly", { includeLawHub: false })).toBe(
      "/checkout?plan=monthly&includeLawHub=0",
    )
  })

  it("includes a validated successPath on the checkout handoff URL", () => {
    expect(
      checkoutPathForPlan("monthly", {
        successPath: "/app/diagnostic/results?checkout=success",
      }),
    ).toBe(
      "/checkout?plan=monthly&successPath=%2Fapp%2Fdiagnostic%2Fresults%3Fcheckout%3Dsuccess",
    )
    expect(
      checkoutPathForPlan("monthly", { successPath: "https://evil.example" }),
    ).toBe("/checkout?plan=monthly")
  })

  it("resolves Stripe success path from the upgrade source route", () => {
    expect(resolveCheckoutSuccessPath("/app/diagnostic/results")).toBe(
      "/app/diagnostic/results?checkout=success",
    )
    expect(resolveCheckoutSuccessPath("/app/diagnostic/results/full/attempt-1")).toBe(
      "/app/diagnostic/results/full/attempt-1?checkout=success",
    )
    expect(resolveCheckoutSuccessPath("/app")).toBe(DEFAULT_CHECKOUT_SUCCESS_PATH)
  })

  it("parses only allowed in-app checkout success paths", () => {
    expect(parseCheckoutSuccessPathParam("/app/lsac-link-step?checkout=success")).toBe(
      "/app/lsac-link-step?checkout=success",
    )
    expect(parseCheckoutSuccessPathParam("/onboarding?checkout=success")).toBe(
      "/onboarding?checkout=success",
    )
    expect(parseCheckoutSuccessPathParam("../etc/passwd")).toBeNull()
    expect(parseCheckoutSuccessPathParam("/login")).toBeNull()
    expect(parseCheckoutSuccessPathParam(null)).toBeNull()
  })

  it("maps logged-out checkout search to signup with plan intent", () => {
    expect(signupPathFromCheckoutSearch("?plan=three_month")).toBe(
      "/signup?plan=three_month",
    )
    expect(readPendingCheckoutPlan()).toBe("three_month")

    expect(signupPathFromCheckoutSearch("plan=monthly&includeLawHub=0")).toBe(
      "/signup?plan=monthly&includeLawHub=0",
    )
    expect(readPendingCheckoutPlan()).toBe("monthly")

    expect(signupPathFromCheckoutSearch("?plan=bogus")).toBe("/signup")
    expect(signupPathFromCheckoutSearch("")).toBe("/signup")
  })
})
