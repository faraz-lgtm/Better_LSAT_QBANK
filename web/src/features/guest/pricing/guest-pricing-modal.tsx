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
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[1180px] flex-col overflow-hidden rounded-[20px] border border-[#dfe1e7] bg-[var(--primary-0)] p-6 shadow-[0px_24px_48px_rgba(13,13,18,0.16)] sm:p-8"
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
                  ? "Core plans include Official LSAT PrepPlus (LawHub Advantage) for year one at checkout."
                  : "Choose a Core plan — you keep your own LawHub PrepPlus subscription."}
              </p>
            </div>

            {error ? <p className="pricing-page__error">{error}</p> : null}

            <div className="pricing-page__grid">
              <PricingPlanCard
                plan={{ ...FREE_PRICING_PLAN, ctaLabel: freeCtaLabel }}
                ctaVariant="orange"
                disabled={checkoutPlan !== null}
                onSelect={() => {
                  onOpenChange(false)
                  onContinueFree?.()
                }}
              />
              {PAID_PRICING_PLANS.map((plan) => (
                <PricingPlanCard
                  key={plan.id}
                  plan={plan}
                  includeLawHub={includeLawHub}
                  highlighted={plan.featured}
                  ctaVariant={plan.id === "monthly" ? "orange" : "navy"}
                  isLoading={checkoutPlan === plan.id}
                  disabled={checkoutPlan !== null}
                  onSelect={() => void handleSelectPlan(plan.id)}
                />
              ))}
            </div>

            <p className="pricing-page__footnote mt-4">
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
