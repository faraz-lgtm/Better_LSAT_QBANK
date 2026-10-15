import { describe, expect, it } from "vitest"

import {
  FREE_PRICING_PLAN,
  getPricingPlanById,
  isPaidPricingPlan,
  resolveCurrentPricingPlan,
} from "@/features/guest/pricing/guest-pricing-plans-data"

describe("resolveCurrentPricingPlan", () => {
  it("returns Free Access package details when the user has no core plan", () => {
    const plan = resolveCurrentPricingPlan({ hasActiveCore: false })
    expect(plan).toEqual(FREE_PRICING_PLAN)
    expect(plan.features).toContain("Free Diagnostic")
    expect(plan.features).not.toContain("50 questions/day")
  })

  it("returns the exact paid package for the user's checkout plan", () => {
    const plan = resolveCurrentPricingPlan({
      hasActiveCore: true,
      checkoutPlan: "six_month",
    })
    expect(plan.id).toBe("six_month")
    expect(plan.name).toBe("6 Months")
    expect(plan.features).toEqual(getPricingPlanById("six_month").features)
  })

  it("falls back to Full Access without a monthly renewal claim when checkout plan is unknown", () => {
    const plan = resolveCurrentPricingPlan({ hasActiveCore: true, checkoutPlan: null })
    expect(plan.name).toBe("Full Access")
    expect(isPaidPricingPlan(plan) ? plan.renewalNote : "x").toBe("")
    expect(plan.name).not.toBe("Monthly")
  })
})
