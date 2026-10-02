import type { PaidPricingPlan } from "@/features/guest/pricing/guest-pricing-plans-data"

const LAWHUB_ADVANTAGE_YEARLY_PRICE = 99

const LAWHUB_ADVANTAGE_BILLING_NOTE =
  "LawHub Advantage ($99/year) is billed once today with your Core plan. Monthly renews at $69/month. The 3-month plan renews at $192 every 3 months. The 6-month plan renews at $354 every 6 months."

const LAWHUB_OWN_PREPPLUS_NOTE =
  "Core is due today at $69, $192, or $354. LawHub PrepPlus is billed separately through LSAC."

type GuestPricingDueToday = {
  amount: number
  label: string
  emphasized: boolean
}

function resolveGuestPricingDueToday(
  plan: PaidPricingPlan,
  lawHubAdvantageBundled: boolean,
): GuestPricingDueToday {
  if (!lawHubAdvantageBundled) {
    return {
      amount: plan.priceUsd,
      label: `$${plan.priceUsd} due today`,
      emphasized: false,
    }
  }

  const amount = plan.priceUsd + LAWHUB_ADVANTAGE_YEARLY_PRICE
  return {
    amount,
    label: `$${amount} due today (incl. $${LAWHUB_ADVANTAGE_YEARLY_PRICE} LawHub Advantage)`,
    emphasized: true,
  }
}

export {
  LAWHUB_ADVANTAGE_BILLING_NOTE,
  LAWHUB_ADVANTAGE_YEARLY_PRICE,
  LAWHUB_OWN_PREPPLUS_NOTE,
  resolveGuestPricingDueToday,
  type GuestPricingDueToday,
}
