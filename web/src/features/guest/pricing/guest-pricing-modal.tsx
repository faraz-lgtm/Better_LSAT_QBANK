import { useEffect, useState } from "react"
import { X } from "lucide-react"

import { PricingPlanCard } from "@/features/billing/pricing-plan-card"
import {
  LAWHUB_ADVANTAGE_BILLING_NOTE,
  LAWHUB_OWN_PREPPLUS_NOTE,
} from "@/features/guest/pricing/guest-pricing-lawhub"
import {
  FREE_PRICING_PLAN,
  PAID_PRICING_PLANS,
  type GuestPricingPlanId,
} from "@/features/guest/pricing/guest-pricing-plans-data"

type GuestPricingModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPlan?: (planId: GuestPricingPlanId, options?: { includeLawHub: boolean }) => Promise<void> | void
  onContinueFree?: () => void
  freeCtaLabel?: string
}

/** Pricing modal matched to the `/app/pricing` page card layout. */
function GuestPricingModal({
  open,
  onOpenChange,
  onSelectPlan,
  onContinueFree,
  freeCtaLabel = FREE_PRICING_PLAN.ctaLabel,
}: GuestPricingModalProps) {
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

  const featuredPlan = PAID_PRICING_PLANS.find((plan) => plan.featured) ?? PAID_PRICING_PLANS[0]
  const gridPaidPlans = PAID_PRICING_PLANS.filter((plan) => plan.id !== featuredPlan.id)

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
        className="pricing-modal relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[1280px] flex-col overflow-hidden rounded-[20px] border border-[#dfe1e7] bg-[var(--primary-0)] p-4 shadow-[0px_24px_48px_rgba(13,13,18,0.16)] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full border border-[#dfe1e7] bg-white text-[#666d80] hover:bg-[#edf3ff]"
          aria-label="Close pricing"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-4" />
        </button>

        <div className="pricing-modal__body min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          <div className="pricing-page">
            <div className="pricing-page__header">
              <h1 id="guest-pricing-modal-title" className="pricing-page__title">
                Pricing
              </h1>
              <p className="pricing-page__subtitle">
                {includeLawHub
                  ? "Core plans include Official LSAT PrepPlus (LawHub Advantage) for year one at checkout."
                  : "Choose a Core plan — you keep your own LawHub PrepPlus subscription."}
              </p>
            </div>

            {error ? <p className="pricing-page__error">{error}</p> : null}

            <div className="pricing-page__stack">
              <PricingPlanCard
                plan={featuredPlan}
                includeLawHub={includeLawHub}
                layout="featured"
                highlighted
                ctaVariant="navy"
                isLoading={checkoutPlan === featuredPlan.id}
                disabled={checkoutPlan !== null}
                onSelect={() => void handleSelectPlan(featuredPlan.id)}
              />
              <div className="pricing-page__plans">
                <PricingPlanCard
                  plan={{ ...FREE_PRICING_PLAN, ctaLabel: freeCtaLabel }}
                  isCurrent
                  ctaVariant="orange"
                  disabled={checkoutPlan !== null}
                  onSelect={() => {
                    onOpenChange(false)
                    onContinueFree?.()
                  }}
                />
                {gridPaidPlans.map((plan) => (
                  <PricingPlanCard
                    key={plan.id}
                    plan={plan}
                    includeLawHub={includeLawHub}
                    ctaVariant={plan.id === "monthly" ? "orange" : "navy"}
                    isLoading={checkoutPlan === plan.id}
                    disabled={checkoutPlan !== null}
                    onSelect={() => void handleSelectPlan(plan.id)}
                  />
                ))}
              </div>
            </div>

            <p className="pricing-page__footnote">
              {includeLawHub ? LAWHUB_ADVANTAGE_BILLING_NOTE : LAWHUB_OWN_PREPPLUS_NOTE}
            </p>

            <div className="pricing-page__alt-link">
              {includeLawHub ? (
                <button type="button" onClick={() => setIncludeLawHub(false)}>
                  I already have LawHub PrepPlus — pay for Core only
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
