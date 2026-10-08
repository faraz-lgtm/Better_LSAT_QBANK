import { ArrowRight, Check } from "lucide-react"

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
  /** Full-width current-plan banner (e.g. Free for free accounts). */
  layout?: "default" | "current"
  ctaVariant?: "orange" | "navy"
  isLoading?: boolean
  disabled?: boolean
  onSelect: () => void
}

function PricingPlanCard({
  plan,
  includeLawHub = true,
  highlighted = false,
  layout = "default",
  ctaVariant = "navy",
  isLoading = false,
  disabled = false,
  onSelect,
}: PricingPlanCardProps) {
  const dueToday = isPaidPricingPlan(plan) ? resolveGuestPricingDueToday(plan, includeLawHub) : null
  const priceSuffix = plan.id === "monthly" ? "/mo" : null
  const isCurrent = layout === "current"

  return (
    <div
      className={cn(
        "pricing-card",
        highlighted && "pricing-card--highlighted",
        isCurrent && "pricing-card--current",
      )}
    >
      {isCurrent ? <span className="pricing-card__badge">Current plan</span> : null}
      {isPaidPricingPlan(plan) && plan.badge && !isCurrent ? (
        <span className="pricing-card__badge">{plan.badge}</span>
      ) : null}
      <div className={cn(isCurrent && "pricing-card__current-body")}>
        <div className={cn(isCurrent && "pricing-card__current-main")}>
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
        <div className={cn(isCurrent && "pricing-card__current-cta")}>
          <button
            type="button"
            className={cn(
              "pricing-card__cta",
              ctaVariant === "orange" ? "pricing-card__cta--orange" : "pricing-card__cta--navy",
            )}
            disabled={disabled || isLoading}
            onClick={onSelect}
          >
            {isLoading ? "Redirecting…" : plan.ctaLabel}
            {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" aria-hidden /> : null}
          </button>
          <p className="pricing-card__note">{plan.lawHubNote}</p>
        </div>
      </div>
    </div>
  )
}

export { PricingPlanCard }
