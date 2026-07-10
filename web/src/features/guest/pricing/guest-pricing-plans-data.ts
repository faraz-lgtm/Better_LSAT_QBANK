import type { LucideIcon } from "lucide-react"
import { BookOpen, Star, Video } from "lucide-react"

export type GuestPricingPlanId = "core" | "live" | "elite"

export type GuestPricingPlan = {
  id: GuestPricingPlanId
  name: string
  description: string
  monthlyPrice: number
  icon: LucideIcon
  badge?: string
  featured?: boolean
  features: string[]
  ctaLabel: string
}

const GUEST_PRICING_PLANS: GuestPricingPlan[] = [
  {
    id: "core",
    name: "Core",
    description: "Everything you need to improve your score.",
    monthlyPrice: 79,
    icon: BookOpen,
    features: [
      "Full question bank — 6,000+ explanations",
      "Official LSAC questions & full-length tests",
      "Section drills & timed practice",
      "Score analytics & performance tracking",
      "Structured 3-month course curriculum",
      "Written & video explanations",
      "Personalized study plan from diagnostic",
      "Unlimited practice tests",
    ],
    ctaLabel: "Get Core",
  },
  {
    id: "live",
    name: "Live",
    description: "For students who want live instruction.",
    monthlyPrice: 139,
    icon: Video,
    badge: "Most Popular",
    featured: true,
    features: [
      "Everything in Core, plus:",
      "Live weekly classes with LSAT instructors",
      "Live Q&A and group sessions",
      "Priority support (24h response)",
      "1-on-1 tutoring session (2h/month)",
      "Live classes launching soon — lock in pricing now",
    ],
    ctaLabel: "Get Live",
  },
  {
    id: "elite",
    name: "Elite",
    description: "Maximum support for your best score.",
    monthlyPrice: 299,
    icon: Star,
    badge: "Best Results",
    featured: true,
    features: [
      "Everything in Live, plus:",
      "Unlimited 1-on-1 tutoring",
      "Dedicated study coach",
      "Score guarantee or money back",
      "Early access to new content",
      "Direct instructor feedback on essays",
    ],
    ctaLabel: "Get Elite",
  },
]

const GUEST_PRICING_TRUST_ITEMS = [
  {
    title: "Score Guarantee",
    description: "Elite plan or full refund",
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

export { GUEST_PRICING_PLANS, GUEST_PRICING_TRUST_ITEMS }
