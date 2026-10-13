import {
  isPaidPricingPlan,
  type PaidPricingPlan,
  type PricingPlan,
} from "@/features/guest/pricing/guest-pricing-plans-data"
import { resolveGuestPricingDueToday } from "@/features/guest/pricing/guest-pricing-lawhub"
import { cn } from "@/lib/utils"

type PricingPlanCardProps = {
  plan: PricingPlan
  includeLawHub?: boolean
  highlighted?: boolean
  /** Full-width featured banner (e.g. Most Popular). */
  layout?: "default" | "featured"
  /** Legacy current-plan treatment; unused in Figma redesign. */
  isCurrent?: boolean
  ctaVariant?: "orange" | "navy"
  isLoading?: boolean
  disabled?: boolean
  onSelect: () => void
}

type ContinueDiscountNote = NonNullable<PaidPricingPlan["continueDiscountNote"]>

function FeatureCheck() {
  return (
    <span className="pricing-card__check" aria-hidden>
      ✓
    </span>
  )
}

function ContinueDiscountCallout({
  note,
  centered = false,
}: {
  note: ContinueDiscountNote
  centered?: boolean
}) {
  return (
    <div className={cn("pricing-card__callout", centered && "pricing-card__callout--centered")}>
      <p className="pricing-card__callout-title">{note.title}</p>
      <p className="pricing-card__callout-body">
        {note.bodyBefore}
        <strong>{note.amountLabel}</strong>
        {note.bodyAfter}
      </p>
    </div>
  )
}

function PricingPlanCard({
  plan,
  includeLawHub = true,
  highlighted = false,
  layout = "default",
  isCurrent = false,
  ctaVariant = "navy",
  isLoading = false,
  disabled = false,
  onSelect,
}: PricingPlanCardProps) {
  const isFeatured = layout === "featured"
  const isPaid = isPaidPricingPlan(plan)
  const dueToday =
    isPaid && plan.showDueToday ? resolveGuestPricingDueToday(plan, includeLawHub) : null
  const priceSuffix = plan.id === "monthly" ? "/mo" : null
  const badgeLabel =
    isCurrent && !isFeatured
      ? "Current plan"
      : isPaid && plan.badge
        ? plan.badge
        : null
  const showDescriptionAbovePrice = isFeatured
  const showDescriptionBelowPrice = !isFeatured && (!isPaid || !plan.equivalentMonthlyUsd)
  const continueNote = isPaid ? plan.continueDiscountNote : undefined

  return (
    <div
      className={cn(
        "pricing-card",
        highlighted && "pricing-card--highlighted",
        isCurrent && "pricing-card--current",
        isFeatured && "pricing-card--featured",
      )}
    >
      {badgeLabel ? <span className="pricing-card__badge">{badgeLabel}</span> : null}
      <div className={cn("pricing-card__body", isFeatured && "pricing-card__featured-body")}>
        <div className={cn(isFeatured && "pricing-card__featured-main")}>
          <h2 className={cn("pricing-card__name", plan.id === "free" && "pricing-card__name--heavy")}>
            {plan.name}
          </h2>
          <p
            className={cn(
              "pricing-card__headline",
              plan.id === "free" && "pricing-card__headline--heavy",
            )}
          >
            {plan.headline}
          </p>
          {showDescriptionAbovePrice ? (
            <p className="pricing-card__tagline">{plan.description}</p>
          ) : null}
          <div className="pricing-card__price-block">
            <p className="pricing-card__price">
              ${plan.priceUsd}
              {priceSuffix ? <span>{priceSuffix}</span> : null}
            </p>
            {showDescriptionBelowPrice ? (
              <p className="pricing-card__tagline pricing-card__tagline--under-price">
                {plan.description}
              </p>
            ) : null}
            {isPaid && plan.equivalentMonthlyUsd ? (
              <p className="pricing-card__meta">Equivalent to ${plan.equivalentMonthlyUsd}/month</p>
            ) : null}
            {isPaid && plan.discountLabel ? (
              <p className="pricing-card__discount">{plan.discountLabel}</p>
            ) : null}
            {dueToday ? <p className="pricing-card__due-today">{dueToday.label}</p> : null}
          </div>
        </div>

        <ul className="pricing-card__features">
          {plan.features.map((feature) => (
            <li key={feature}>
              <FeatureCheck />
              <span>{feature}</span>
            </li>
          ))}
          {isPaid ? (
            <li>
              <FeatureCheck />
              <span>{plan.renewalNote}</span>
            </li>
          ) : null}
        </ul>

        <div className={cn("pricing-card__cta-wrap", isFeatured && "pricing-card__featured-cta")}>
          {continueNote ? (
            <ContinueDiscountCallout note={continueNote} centered={isFeatured} />
          ) : null}
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
            {!isLoading ? (
              <span className="pricing-card__cta-arrow" aria-hidden>
                →
              </span>
            ) : null}
          </button>
          <p className="pricing-card__note">{plan.lawHubNote}</p>
        </div>
      </div>
    </div>
  )
}

export { PricingPlanCard }
