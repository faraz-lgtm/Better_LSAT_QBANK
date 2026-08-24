import type { LucideIcon } from "lucide-react"
import { BookOpen, Video } from "lucide-react"

export type GuestPricingPlanId = "core" | "live"

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
    monthlyPrice: 70,
    icon: BookOpen,
    features: [
      "Full question bank — 6,000+ explanations",
      "Official LSAC questions & full-length tests",
      "Section drills & timed practice",
      "Score analytics & performance tracking",
      "Structured course curriculum",
      "Written & video explanations (videos coming soon)",
      "Personalized study plan from diagnostic",
    ],
    ctaLabel: "Get Core",
  },
  {
    id: "live",
    name: "Live",
    description: "For students who want live instruction.",
    monthlyPrice: 129,
    icon: Video,
    badge: "Most Comprehensive",
    featured: true,
    features: [
      "Everything in Core, plus:",
      "Live weekly classes with LSAT instructors",
      "Live Q&A and group sessions",
      "Priority support",
      "Live classes launching soon — lock in pricing now",
    ],
    ctaLabel: "Get Live",
  },
]

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

export { GUEST_PRICING_PLANS, GUEST_PRICING_TRUST_ITEMS }
