import { describe, expect, it } from "vitest"

import { PAID_PRICING_PLANS } from "@/features/guest/pricing/guest-pricing-plans-data"
import { resolveGuestPricingDueToday } from "@/features/guest/pricing/guest-pricing-lawhub"

describe("guest pricing lawhub", () => {
  it("uses the Core price when LawHub Advantage is off", () => {
    const monthly = PAID_PRICING_PLANS.find((plan) => plan.id === "monthly")!
    expect(resolveGuestPricingDueToday(monthly, false)).toEqual({
      amount: 69,
      label: "$69 due today",
      emphasized: false,
    })
  })

  it("adds $99 LawHub Advantage when bundled", () => {
    const threeMonth = PAID_PRICING_PLANS.find((plan) => plan.id === "three_month")!
    expect(resolveGuestPricingDueToday(threeMonth, true)).toEqual({
      amount: 291,
      label: "$291 due today (incl. $99 LawHub Advantage)",
      emphasized: true,
    })
  })

  it("adds LawHub to the 6-month price", () => {
    const sixMonth = PAID_PRICING_PLANS.find((plan) => plan.id === "six_month")!
    expect(resolveGuestPricingDueToday(sixMonth, true).amount).toBe(453)
  })
})
