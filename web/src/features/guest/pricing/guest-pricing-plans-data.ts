export type CheckoutPlanId = "monthly" | "three_month" | "six_month" | "yearly"

export type PaidPricingPlan = {
  id: CheckoutPlanId
  name: string
  headline: string
  description: string
  priceUsd: number
  /** Pre-discount list price shown struck through next to priceUsd. */
  listPriceUsd?: number
  equivalentMonthlyUsd: number | null
  discountLabel: string | null
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
const LAWHUB_SEPARATE_NOTE =
  "LawHub Advantage required for official LSAT content: $124/year, paid separately to LSAC."

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
    lawHubNote: LAWHUB_SEPARATE_NOTE,
  },
  {
    id: "three_month",
    name: "3 Months",
    headline: "A Focused 3-Month Prep Plan.",
    description: "Full platform access for a defined prep window—with a lower monthly equivalent.",
    priceUsd: 192,
    listPriceUsd: 207,
    equivalentMonthlyUsd: 64,
    discountLabel: "Save $15 vs. Paying $69/month",
    features: [
      "Everything in Full Access",
      "Built for a focused prep block",
      "One upfront payment",
      "Need more time? Keep your discount.",
    ],
    renewalNote: "Renews at $192 every 3 months.",
    ctaLabel: "Choose 3 Months",
    lawHubNote: LAWHUB_SEPARATE_NOTE,
  },
  {
    id: "six_month",
    name: "6 Months",
    headline: "More Time. Better Monthly Value.",
    description: "Give yourself more runway while lowering the monthly equivalent.",
    priceUsd: 354,
    listPriceUsd: 414,
    equivalentMonthlyUsd: 59,
    discountLabel: "Save $60 vs. Paying $69/month",
    badge: "Most Popular",
    featured: true,
    showDueToday: true,
    features: [
      "Everything in Full Access",
      "Built for a longer prep timeline",
      "One upfront payment",
      "Need more time? Keep your discount.",
    ],
    renewalNote: "Renews at $354 every 6 months.",
    ctaLabel: "Choose 6 Months",
    lawHubNote: LAWHUB_SEPARATE_NOTE,
  },
  {
    id: "yearly",
    name: "12 Months",
    headline: "The Best Value for a Full Year.",
    description: "Get a full year of BetterLSAT access at the lowest monthly equivalent.",
    priceUsd: 624,
    listPriceUsd: 828,
    equivalentMonthlyUsd: 52,
    discountLabel: "Save $204 vs. Paying $69/month",
    features: [
      "Everything in Full Access",
      "Best monthly value",
      "Built for a full-year prep timeline",
      "One upfront payment",
    ],
    renewalNote: "Renews at $624 every 12 months.",
    ctaLabel: "Choose 12 Months",
    lawHubNote: LAWHUB_SEPARATE_NOTE,
  },
]

const PRICING_PLANS: PricingPlan[] = [FREE_PRICING_PLAN, ...PAID_PRICING_PLANS]

/** Paid access when Stripe interval is unknown — do not claim Monthly / $69 renewal. */
const FULL_ACCESS_FALLBACK_PLAN: PaidPricingPlan = {
  id: "monthly",
  name: "Full Access",
  headline: "Full Access.",
  description: "Full BetterLSAT platform access with your active subscription.",
  priceUsd: 69,
  equivalentMonthlyUsd: null,
  discountLabel: null,
  features: [
    "Structured courses + explanations",
    "Drills, sections and full PrepTests",
    "Blind Review for deeper review",
    "Weak-area and performance analytics",
    "Cancel anytime",
  ],
  renewalNote: "",
  ctaLabel: "Manage Plan",
  lawHubNote: LAWHUB_REQUIRED_NOTE,
}

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
  // Paid access without a known checkout interval — avoid mislabeling as Monthly.
  return FULL_ACCESS_FALLBACK_PLAN
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
