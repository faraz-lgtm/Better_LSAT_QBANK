import { describe, expect, it } from "vitest"

import { GUEST_PRICING_PLANS } from "@/features/guest/pricing/guest-pricing-plans-data"
import { resolveGuestPricingDueToday } from "@/features/guest/pricing/guest-pricing-lawhub"

describe("guest pricing lawhub", () => {
  it("uses standard due-today amounts when LawHub Advantage is off", () => {
    const core = GUEST_PRICING_PLANS.find((plan) => plan.id === "core")!
    expect(resolveGuestPricingDueToday(core, false)).toEqual({
      amount: 79,
      label: "$79 due today",
      emphasized: false,
    })
  })

  it("adds $99 LawHub Advantage when bundled toggle is on", () => {
    const live = GUEST_PRICING_PLANS.find((plan) => plan.id === "live")!
    expect(resolveGuestPricingDueToday(live, true)).toEqual({
      amount: 238,
      label: "$238 due today (incl. $99 LawHub Advantage)",
      emphasized: true,
    })
  })
})
