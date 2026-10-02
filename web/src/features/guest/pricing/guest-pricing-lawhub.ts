import type { GuestPricingPlan } from "@/features/guest/pricing/guest-pricing-plans-data"

const LAWHUB_ADVANTAGE_YEARLY_PRICE = 99

const LAWHUB_ADVANTAGE_BILLING_NOTE =
  "LawHub Advantage ($99/year) is billed once today, then $70 or $129/mon starting next month."

type GuestPricingDueToday = {
  amount: number
  label: string
  emphasized: boolean
}

function resolveGuestPricingDueToday(
  plan: GuestPricingPlan,
  lawHubAdvantageBundled: boolean,
): GuestPricingDueToday {
  if (!lawHubAdvantageBundled) {
    return {
      amount: plan.monthlyPrice,
      label: `$${plan.monthlyPrice} due today`,
      emphasized: false,
    }
  }

  const amount = plan.monthlyPrice + LAWHUB_ADVANTAGE_YEARLY_PRICE
  return {
    amount,
    label: `$${amount} due today (incl. $${LAWHUB_ADVANTAGE_YEARLY_PRICE} LawHub Advantage)`,
    emphasized: true,
  }
}

export {
  LAWHUB_ADVANTAGE_BILLING_NOTE,
  LAWHUB_ADVANTAGE_YEARLY_PRICE,
  resolveGuestPricingDueToday,
  type GuestPricingDueToday,
}
