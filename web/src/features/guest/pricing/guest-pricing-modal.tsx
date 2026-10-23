import { useEffect, useState } from "react"

import pricingModalCloseIcon from "@/assets/pricing-modal-close.svg"
import { Checkbox } from "@/components/ui/checkbox"
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

/** Pricing modal matched to the Figma pricing frame (21427:23428). */
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
      className="fixed inset-0 z-[130] flex items-stretch justify-center bg-black/30 p-0 backdrop-blur-[3px] sm:items-center sm:p-3 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-pricing-modal-title"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="pricing-modal relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[1284px] flex-col overflow-hidden rounded-none border-0 border-[#dde5f0] bg-[#f7faff] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] shadow-none sm:h-auto sm:max-h-[calc(100dvh-1rem)] sm:rounded-[28px] sm:border sm:px-8 sm:py-5 sm:shadow-[0px_24px_48px_rgba(13,13,18,0.16)] md:rounded-[36px] lg:h-auto lg:max-h-[calc(100dvh-0.75rem)] lg:rounded-[42px] lg:px-[52px]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="pricing-modal__close"
          aria-label="Close pricing"
          onClick={() => onOpenChange(false)}
        >
          <img
            src={pricingModalCloseIcon}
            alt=""
            className="pricing-modal__close-icon"
            width={36}
            height={36}
          />
        </button>

        <div className="pricing-modal__body">
          <div className="pricing-page">
            <div className="pricing-page__header">
              <h1 id="guest-pricing-modal-title" className="pricing-page__title">
                Every Paid Plan Includes the Full Platform.
              </h1>
              <label
                className={
                  includeLawHub
                    ? "pricing-page__lsac-checkbox"
                    : "pricing-page__lsac-checkbox pricing-page__lsac-checkbox--active"
                }
              >
                <Checkbox
                  size="md"
                  className="pricing-page__lsac-checkbox-control"
                  checked={!includeLawHub}
                  disabled={checkoutPlan !== null}
                  onChange={(event) => setIncludeLawHub(!event.target.checked)}
                  aria-label="I already have LSAC PrepPlus to link"
                />
                <span className="pricing-page__lsac-checkbox-copy">
                  <span className="pricing-page__lsac-checkbox-title">
                    Already have LawHub PrepPlus?
                  </span>
                  <span className="pricing-page__lsac-checkbox-detail">
                    Check this to pay for BetterLSAT only — you&apos;ll link your existing LSAC account
                    after checkout.
                  </span>
                </span>
              </label>
              <p className="pricing-page__subtitle">
                {includeLawHub
                  ? "Choose the access period that fits your prep timeline. Your tools stay the same."
                  : "Choose a Monthly, 3 Months, 6 Months, or 12 Months plan — you keep your own LawHub PrepPlus subscription."}
              </p>
            </div>

            {error ? <p className="pricing-page__error">{error}</p> : null}

            <div className="pricing-page__stack">
              <PricingPlanCard
                plan={featuredPlan}
                includeLawHub={includeLawHub}
                layout="featured"
                highlighted
                ctaVariant="orange"
                isLoading={checkoutPlan === featuredPlan.id}
                disabled={checkoutPlan !== null}
                onSelect={() => void handleSelectPlan(featuredPlan.id)}
              />
              <div className="pricing-page__plans">
                <PricingPlanCard
                  plan={{ ...FREE_PRICING_PLAN, ctaLabel: freeCtaLabel }}
                  ctaVariant="navy"
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
                    ctaVariant="navy"
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
                <button
                  type="button"
                  disabled={checkoutPlan !== null}
                  onClick={() => setIncludeLawHub(false)}
                >
                  I already have LawHub PrepPlus — Pay for BetterLSAT Only
                </button>
              ) : (
                <button
                  type="button"
                  disabled={checkoutPlan !== null}
                  onClick={() => setIncludeLawHub(true)}
                >
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
