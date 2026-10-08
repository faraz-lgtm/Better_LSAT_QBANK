export type CheckoutPlanId = "monthly" | "three_month" | "six_month" | "yearly"

export type PaidPricingPlan = {
  id: CheckoutPlanId
  name: string
  headline: string
  description: string
  priceUsd: number
  equivalentMonthlyUsd: number | null
  discountLabel: string | null
  badge?: string
  featured?: boolean
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

const LAWHUB_REQUIRED_NOTE = "LawHub Advantage is required for official LSAT questions."

const FREE_PRICING_PLAN: FreePricingPlan = {
  id: "free",
  name: "Free Access",
  headline: "Start Free. See How BetterLSAT Works.",
  description: "Get a feel for the BetterLSAT workflow before choosing a paid plan.",
  priceUsd: 0,
  features: [
    "Persistent free access",
    "Free Diagnostic",
    "Essentials Module 1",
    "Limited BetterLSAT access",
    "See how BetterLSAT guides your next step",
  ],
  ctaLabel: "Create Free Account",
  lawHubNote: "Official-question features require LawHub Advantage.",
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
      "Drills, sections & full PrepTests",
      "Blind Review for deeper review",
      "Weak-area & performance analytics",
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
    name: "Yearly",
    headline: "The Best Value for a Full Year.",
    description: "Get a full year of BetterLSAT access at the lowest monthly equivalent.",
    priceUsd: 624,
    equivalentMonthlyUsd: 52,
    discountLabel: "25% Ongoing Discount",
    features: [
      "Everything in Full Access",
      "Best monthly value",
      "Built for a full-year prep timeline",
      "One upfront payment",
    ],
    renewalNote: "Renews at $624 every 12 months.",
    ctaLabel: "Choose Yearly",
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

export {
  FREE_PRICING_PLAN,
  GUEST_PRICING_TRUST_ITEMS,
  PAID_PRICING_PLANS,
  PRICING_PLANS,
  isPaidPricingPlan,
}

export type GuestPricingPlanId = CheckoutPlanId
