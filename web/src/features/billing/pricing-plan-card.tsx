import { ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  isPaidPricingPlan,
  type PricingPlan,
} from "@/features/guest/pricing/guest-pricing-plans-data"
import { resolveGuestPricingDueToday } from "@/features/guest/pricing/guest-pricing-lawhub"
import { cn } from "@/lib/utils"

type PricingPlanCardProps = {
  plan: PricingPlan
  includeLawHub?: boolean
  highlighted?: boolean
  ctaVariant?: "orange" | "navy"
  isLoading?: boolean
  disabled?: boolean
  onSelect: () => void
}

function PricingPlanCard({
  plan,
  includeLawHub = true,
  highlighted = false,
  ctaVariant = "navy",
  isLoading = false,
  disabled = false,
  onSelect,
}: PricingPlanCardProps) {
  const dueToday = isPaidPricingPlan(plan) ? resolveGuestPricingDueToday(plan, includeLawHub) : null
  const priceSuffix = plan.id === "monthly" ? "/mo" : null

  return (
    <div className={cn("pricing-card", highlighted && "pricing-card--highlighted")}>
      {isPaidPricingPlan(plan) && plan.badge ? (
        <span className="pricing-card__badge">{plan.badge}</span>
      ) : null}
      <h2 className="pricing-card__name">{plan.name}</h2>
      <p className="pricing-card__headline">{plan.headline}</p>
      <p className="pricing-card__tagline">{plan.description}</p>
      <div className="pricing-card__price-block">
        <p className="pricing-card__price">
          ${plan.priceUsd}
          {priceSuffix ? <span>{priceSuffix}</span> : null}
        </p>
        {isPaidPricingPlan(plan) && plan.equivalentMonthlyUsd ? (
          <p className="pricing-card__meta">Equivalent to ${plan.equivalentMonthlyUsd}/month</p>
        ) : null}
        {isPaidPricingPlan(plan) && plan.discountLabel ? (
          <p className="pricing-card__discount">{plan.discountLabel}</p>
        ) : null}
        {dueToday ? <p className="pricing-card__due-today">{dueToday.label}</p> : null}
      </div>
      <ul className="pricing-card__features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <Check className="pricing-card__check" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
        {isPaidPricingPlan(plan) ? (
          <li>
            <Check className="pricing-card__check" aria-hidden />
            <span>{plan.renewalNote}</span>
          </li>
        ) : null}
      </ul>
      <Button
        className={cn(
          "pricing-card__cta",
          ctaVariant === "orange" ? "pricing-card__cta--orange" : "pricing-card__cta--navy",
        )}
        disabled={disabled}
        onClick={onSelect}
      >
        {isLoading ? "Redirecting…" : plan.ctaLabel}
        {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" aria-hidden /> : null}
      </Button>
      <p className="pricing-card__note">{plan.lawHubNote}</p>
    </div>
  )
}

export { PricingPlanCard }
