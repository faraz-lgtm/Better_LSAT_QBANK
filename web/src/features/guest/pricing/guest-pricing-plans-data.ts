export type CheckoutPlanId = "monthly" | "three_month" | "six_month" | "yearly"

export type PaidPricingPlan = {
  id: CheckoutPlanId
  name: string
  headline: string
  description: string
  priceUsd: number
  equivalentMonthlyUsd: number | null
  discountLabel: string | null
  /** Callout under features for multi-month plans (continue at discounted monthly rate). */
  continueDiscountNote?: {
    title: string
    bodyBefore: string
    amountLabel: string
    bodyAfter: string
  }
  badge?: string
  featured?: boolean
  /** Show due-today line under price (featured plan in Figma). */
  showDueToday?: boolean
  features: string[]
  renewalNote: string
  ctaLabel: string
  lawHubNote: string
}

export type FreePricingPlan = {
  id: "free"
  name: string
  headline: string
  description: string
  priceUsd: 0
  features: string[]
  ctaLabel: string
  lawHubNote: string
}

export type PricingPlan = FreePricingPlan | PaidPricingPlan

const LAWHUB_REQUIRED_NOTE = "Official-question features require LawHub Advantage."

const FREE_PRICING_PLAN: FreePricingPlan = {
  id: "free",
  name: "Free Access",
  headline: "BetterLSAT platform preview",
  description: "Get a feel for the BetterLSAT workflow before choosing a paid plan.",
  priceUsd: 0,
  features: [
    "Get a feel for the BetterLSAT workflow before choosing a paid plan.",
    "Persistent free access",
    "Essentials Module 1",
    "See how BetterLSAT guides your next step",
    "Free Diagnostic",
    "Limited BetterLSAT access",
  ],
  ctaLabel: "Try For Free",
  lawHubNote: LAWHUB_REQUIRED_NOTE,
}

const PAID_PRICING_PLANS: PaidPricingPlan[] = [
  {
    id: "monthly",
    name: "Monthly",
    headline: "Full Access. Stay Flexible.",
    description: "Get every BetterLSAT tool month to month with no long commitment.",
    priceUsd: 69,
    equivalentMonthlyUsd: null,
    discountLabel: null,
    features: [
      "Monthly access",
      "Structured courses + explanations",
      "Drills, sections and full PrepTests",
      "Blind Review for deeper review",
      "Weak-area and performance analytics",
      "Cancel anytime",
    ],
    renewalNote: "Renews at $69 every month. Cancel anytime.",
    ctaLabel: "Choose Monthly",
    lawHubNote: LAWHUB_REQUIRED_NOTE,
  },
  {
    id: "three_month",
    name: "3 Months",
    headline: "A Focused 3-Month Prep Plan.",
    description: "Full platform access for a defined prep window—with a lower monthly equivalent.",
    priceUsd: 192,
    equivalentMonthlyUsd: 64,
    discountLabel: "7% Ongoing Discount",
    continueDiscountNote: {
      title: "Need more time? Keep your discount.",
      bodyBefore: "After your first 3 months, continue month-to-month at ",
      amountLabel: "$64/month",
      bodyAfter: ".",
    },
    features: [
      "Everything in Full Access",
      "Built for a focused prep block",
      "One upfront payment",
      "Need more time? Keep your discount.",
    ],
    renewalNote: "Renews at $192 every 3 months.",
    ctaLabel: "Choose 3 Months",
    lawHubNote: LAWHUB_REQUIRED_NOTE,
  },
  {
    id: "six_month",
    name: "6 Months",
    headline: "More Time. Better Monthly Value.",
    description: "Give yourself more runway while lowering the monthly equivalent.",
    priceUsd: 354,
    equivalentMonthlyUsd: 59,
    discountLabel: "15% Ongoing Discount",
    badge: "Most Popular",
    featured: true,
    showDueToday: true,
    continueDiscountNote: {
      title: "Need more time? Keep your discount.",
      bodyBefore: "After your first 6 months, continue month-to-month at ",
      amountLabel: "$59/month",
      bodyAfter: ".",
    },
    features: [
      "Everything in Full Access",
      "Built for a longer prep timeline",
      "One upfront payment",
      "Need more time? Keep your discount.",
    ],
    renewalNote: "Renews at $354 every 6 months.",
    ctaLabel: "Choose 6 Months",
    lawHubNote: LAWHUB_REQUIRED_NOTE,
  },
  {
    id: "yearly",
    name: "12 Months",
    headline: "The Best Value for a Full Year.",
    description: "Get a full year of BetterLSAT access at the lowest monthly equivalent.",
    priceUsd: 624,
    equivalentMonthlyUsd: 52,
    discountLabel: "25% Ongoing Discount",
    continueDiscountNote: {
      title: "Need more time? Keep your discount.",
      bodyBefore: "After your first 12 months, continue month-to-month at ",
      amountLabel: "$52/month",
      bodyAfter: ".",
    },
    features: [
      "Everything in Full Access",
      "Best monthly value",
      "Built for a full-year prep timeline",
      "One upfront payment",
    ],
    renewalNote: "Renews at $624 every 12 months.",
    ctaLabel: "Choose 12 Months",
    lawHubNote: LAWHUB_REQUIRED_NOTE,
  },
]

const PRICING_PLANS: PricingPlan[] = [FREE_PRICING_PLAN, ...PAID_PRICING_PLANS]

const GUEST_PRICING_TRUST_ITEMS = [
  {
    title: "Official LSAC Access",
    description: "LawHub Advantage included",
  },
  {
    title: "12,000+ Students",
    description: "Improved their LSAT score",
  },
  {
    title: "7-day Support",
    description: "Real humans, fast replies",
  },
] as const

function isPaidPricingPlan(plan: PricingPlan): plan is PaidPricingPlan {
  return plan.id !== "free"
}

function getPricingPlanById(id: PricingPlan["id"]): PricingPlan {
  if (id === "free") return FREE_PRICING_PLAN
  return PAID_PRICING_PLANS.find((plan) => plan.id === id) ?? PAID_PRICING_PLANS[0]
}

/** Resolve catalog package details for the user's current entitlement / Stripe plan. */
function resolveCurrentPricingPlan(options: {
  hasActiveCore: boolean
  checkoutPlan?: CheckoutPlanId | null
}): PricingPlan {
  if (!options.hasActiveCore) return FREE_PRICING_PLAN
  if (options.checkoutPlan) return getPricingPlanById(options.checkoutPlan)
  // Paid access without a known checkout interval — show Full Access (monthly) package.
  return getPricingPlanById("monthly")
}

export {
  FREE_PRICING_PLAN,
  GUEST_PRICING_TRUST_ITEMS,
  PAID_PRICING_PLANS,
  PRICING_PLANS,
  getPricingPlanById,
  isPaidPricingPlan,
  resolveCurrentPricingPlan,
}

export type GuestPricingPlanId = CheckoutPlanId
