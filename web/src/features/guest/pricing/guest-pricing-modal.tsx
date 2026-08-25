import { useEffect, useState } from "react"
import { ArrowRight, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  LAWHUB_ADVANTAGE_YEARLY_PRICE,
  resolveGuestPricingDueToday,
} from "@/features/guest/pricing/guest-pricing-lawhub"
import {
  GUEST_PRICING_PLANS,
  type GuestPricingPlan,
  type GuestPricingPlanId,
} from "@/features/guest/pricing/guest-pricing-plans-data"
import { cn } from "@/lib/utils"

type GuestPricingModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPlan?: (planId: GuestPricingPlanId, options?: { includeLawHub: boolean }) => Promise<void> | void
}

function PricingCard({
  plan,
  includeLawHub,
  highlighted = false,
  isLoading,
  disabled,
  onSelect,
}: {
  plan: GuestPricingPlan
  includeLawHub: boolean
  highlighted?: boolean
  isLoading: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const dueToday = resolveGuestPricingDueToday(plan, includeLawHub)

  return (
    <div className={cn("pricing-card", highlighted && "pricing-card--highlighted")}>
      {plan.badge ? <span className="pricing-card__badge">{plan.badge}</span> : null}
      <h2 className="pricing-card__name">{plan.name}</h2>
      <p className="pricing-card__tagline">{plan.description}</p>
      <p className="pricing-card__price">
        ${plan.monthlyPrice}
        <span>/month</span>
      </p>
      <p className="pricing-card__due-today">{dueToday.label}</p>
      <ul className="pricing-card__features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <Check className="pricing-card__check" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        className="pricing-card__cta pricing-card__cta--navy"
        disabled={disabled}
        onClick={onSelect}
      >
        {isLoading ? "Redirecting..." : plan.ctaLabel}
        {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" aria-hidden /> : null}
      </Button>
    </div>
  )
}

/** Pricing modal matched to the `/app/pricing` page card layout. */
function GuestPricingModal({ open, onOpenChange, onSelectPlan }: GuestPricingModalProps) {
  const [includeLawHub, setIncludeLawHub] = useState(true)
  const [checkoutPlan, setCheckoutPlan] = useState<GuestPricingPlanId | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setIncludeLawHub(true)
      setCheckoutPlan(null)
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange, open])

  if (!open) return null

  const corePlan = GUEST_PRICING_PLANS.find((plan) => plan.id === "core")!
  const livePlan = GUEST_PRICING_PLANS.find((plan) => plan.id === "live")!

  async function handleSelectPlan(planId: GuestPricingPlanId) {
    setCheckoutPlan(planId)
    setError(null)
    try {
      await onSelectPlan?.(planId, { includeLawHub })
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : "Unable to start checkout.")
      setCheckoutPlan(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[3px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-pricing-modal-title"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[780px] flex-col overflow-hidden rounded-[20px] border border-[#dfe1e7] bg-[var(--primary-0)] p-6 shadow-[0px_24px_48px_rgba(13,13,18,0.16)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 z-10 inline-flex size-9 items-center justify-center rounded-full border border-[#dfe1e7] bg-white text-[#666d80] hover:bg-[#edf3ff]"
          aria-label="Close pricing"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-5" />
        </button>

        <div className="student-scrollbar min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
          <div className="pricing-page">
            <div className="pricing-page__header mb-4">
              <h1 id="guest-pricing-modal-title" className="pricing-page__title">
                Pricing
              </h1>
              <p className="pricing-page__subtitle ">
                {includeLawHub
                  ? "Includes Official LSAT PrepPlus (LawHub Advantage) for year one at checkout."
                  : "Choose Core or Live — you keep your own LawHub PrepPlus subscription."}
              </p>
            </div>

            {error ? <p className="pricing-page__error">{error}</p> : null}

            <div className="pricing-page__grid">
              <PricingCard
                plan={corePlan}
                includeLawHub={includeLawHub}
                isLoading={checkoutPlan === "core"}
                disabled={checkoutPlan !== null}
                onSelect={() => void handleSelectPlan("core")}
              />
              <PricingCard
                plan={livePlan}
                includeLawHub={includeLawHub}
                highlighted
                isLoading={checkoutPlan === "live"}
                disabled={checkoutPlan !== null}
                onSelect={() => void handleSelectPlan("live")}
              />
            </div>

            <p className="pricing-page__footnote mt-4">
              {includeLawHub ? (
                <>
                  LawHub Advantage (${LAWHUB_ADVANTAGE_YEARLY_PRICE}/year) is billed once today, then $
                  {corePlan.monthlyPrice} or ${livePlan.monthlyPrice}/mo starting next month.
                </>
              ) : (
                <>
                  ${corePlan.monthlyPrice} or ${livePlan.monthlyPrice} due today for your first month. LawHub
                  PrepPlus is billed separately through LSAC.
                </>
              )}
            </p>

            <div className="pricing-page__alt-link">
              {includeLawHub ? (
                <button type="button" onClick={() => setIncludeLawHub(false)}>
                  I already have LawHub PrepPlus — pay for Core or Live only
                </button>
              ) : (
                <button type="button" onClick={() => setIncludeLawHub(true)}>
                  Need LawHub PrepPlus included? View standard pricing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { GuestPricingModal }
