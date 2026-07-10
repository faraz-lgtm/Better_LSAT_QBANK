import { useEffect, useState } from "react"
import {
  Check,
  ChevronRight,
  Headphones,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react"

import { Switch } from "@/components/ui/switch"
import {
  LAWHUB_ADVANTAGE_BILLING_NOTE,
  resolveGuestPricingDueToday,
} from "@/features/guest/pricing/guest-pricing-lawhub"
import {
  GUEST_PRICING_PLANS,
  GUEST_PRICING_TRUST_ITEMS,
  type GuestPricingPlan,
} from "@/features/guest/pricing/guest-pricing-plans-data"
import { cn } from "@/lib/utils"

import type { GuestPricingPlanId } from "@/features/guest/pricing/guest-pricing-plans-data"

type GuestPricingModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPlan?: (planId: GuestPricingPlanId) => void
}

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-[1.35] tracking-[0.28px] text-[#062357]">
      <Check className="mt-0.5 size-3.5 shrink-0 text-[#0d47a1]" strokeWidth={2.5} aria-hidden />
      <span>{text}</span>
    </li>
  )
}

function planCardSurfaceClass(plan: GuestPricingPlan): string {
  if (plan.id === "core") {
    return "border-[#dfe1e7] bg-white"
  }
  if (plan.id === "live") {
    return "border-[#b8d4ff] bg-gradient-to-b from-[#edf3ff] to-white shadow-[0px_12px_32px_rgba(13,71,161,0.08)]"
  }
  return "border-[#c5d4ff] bg-gradient-to-b from-[#e8eeff] via-[#f3f6ff] to-white shadow-[0px_12px_32px_rgba(13,71,161,0.08)]"
}

function planCtaClass(plan: GuestPricingPlan): string {
  if (plan.id === "core") {
    return "border border-[#0d47a1] bg-white text-[#0d47a1] hover:bg-[#edf3ff]"
  }
  return "bg-[#0d47a1] text-white hover:bg-[#0b3d8a]"
}

function PricingPlanCard({
  plan,
  lawHubAdvantageBundled,
  onSelectPlan,
}: {
  plan: GuestPricingPlan
  lawHubAdvantageBundled: boolean
  onSelectPlan?: (planId: GuestPricingPlanId) => void
}) {
  const Icon = plan.icon
  const dueToday = resolveGuestPricingDueToday(plan, lawHubAdvantageBundled)

  return (
    <article
      className={cn(
        "relative flex h-full min-h-0 flex-col rounded-[16px] border px-5 pb-5 pt-7 sm:px-6 sm:pb-6 sm:pt-8",
        planCardSurfaceClass(plan),
      )}
    >
      {plan.badge ? (
        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0d47a1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.44px] text-white">
          {plan.badge}
        </span>
      ) : null}

      <div className="flex items-center gap-3">
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[10px] bg-[#edf3ff] text-[#0d47a1]">
          <Icon className="size-4" aria-hidden />
        </span>
        <h3 className="text-xl font-bold leading-[1.3] text-[#062357]">{plan.name}</h3>
      </div>

      <p className="mt-3 min-h-[40px] text-sm leading-[1.35] tracking-[0.28px] text-[#666d80]">
        {plan.description}
      </p>

      <div className="mt-4 min-h-[58px]">
        <p className="flex items-end gap-1">
          <span className="text-[32px] font-extrabold leading-none text-[#062357]">${plan.monthlyPrice}</span>
          <span className="pb-1 text-sm font-medium text-[#666d80]">/month</span>
        </p>
        <p
          className={cn(
            "mt-1 text-xs leading-[1.35] tracking-[0.24px]",
            dueToday.emphasized ? "font-medium text-[#0d47a1]" : "text-[#666d80]",
          )}
        >
          {dueToday.label}
        </p>
      </div>

      <div className="my-5 h-px shrink-0 bg-[#dfe1e7]" />

      <div className="flex min-h-0 flex-1 flex-col">
        <ul className="flex flex-col gap-2.5">
          {plan.features.map((feature) => (
            <PricingFeature key={feature} text={feature} />
          ))}
        </ul>
        <div className="flex-1" aria-hidden />
      </div>

      <button
        type="button"
        onClick={() => onSelectPlan?.(plan.id)}
        className={cn(
          "mt-6 inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-[12px] text-sm font-semibold tracking-[0.28px] transition-colors",
          planCtaClass(plan),
        )}
      >
        {plan.ctaLabel}
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </article>
  )
}

function TrustIcon({ index }: { index: number }) {
  if (index === 0) return <Shield className="size-[18px] text-[#00bc54]" aria-hidden />
  if (index === 1) return <Users className="size-[18px] text-[#0d47a1]" aria-hidden />
  return <Headphones className="size-[18px] text-[#0d47a1]" aria-hidden />
}

/** Figma `19514:29186` / `19514:27221` — premium pricing modal overlay */
function GuestPricingModal({ open, onOpenChange, onSelectPlan }: GuestPricingModalProps) {
  const [lawHubAdvantageBundled, setLawHubAdvantageBundled] = useState(false)

  useEffect(() => {
    if (!open) setLawHubAdvantageBundled(false)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-pricing-modal-title"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[min(1055px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[24px] border border-[#dfe1e7] bg-[#f3f7ff] shadow-[0px_24px_48px_rgba(13,13,18,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 justify-end px-4 pt-4 sm:px-6 sm:pt-5">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#dfe1e7] bg-white text-[#666d80] hover:bg-[#edf3ff]"
            aria-label="Close pricing"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="student-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-b-[24px] px-4 pb-5 sm:px-8 sm:pb-8 md:px-10 md:pb-10 [scrollbar-gutter:stable]">
          <header className="mx-auto flex max-w-[760px] flex-col items-center px-2 text-center sm:px-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#edf3ff] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.44px] text-[#0d47a1]">
              <Sparkles className="size-3" aria-hidden />
              Premium Plans
            </span>
            <h2 id="guest-pricing-modal-title" className="mt-3 text-[28px] font-bold leading-[1.2] text-[#062357] sm:mt-4 sm:text-[32px]">
              Pricing
            </h2>
            <p className="mt-2 max-w-[600px] text-sm leading-[1.5] tracking-[0.28px] text-[#666d80] sm:mt-3">
              Includes Official LSAT PrepPlus (LawHub Advantage) for year one at checkout.
            </p>
            <p className="mt-1 text-sm font-medium tracking-[0.28px] text-[#062357]">
              Checkout canceled. Pick a plan to continue.
            </p>

            <div className="mt-5 flex w-full max-w-[640px] flex-col items-center gap-2.5 sm:mt-6">
              <span className="inline-flex rounded-full bg-[#0d47a1] px-4 py-2 text-sm font-semibold tracking-[0.28px] text-white">
                {lawHubAdvantageBundled
                  ? "I already have LawHub PrepPlus"
                  : "Need LawHub PrepPlus included?"}
              </span>
              <Switch
                checked={lawHubAdvantageBundled}
                onChange={(event) => setLawHubAdvantageBundled(event.target.checked)}
                aria-label={
                  lawHubAdvantageBundled
                    ? "LawHub Advantage bundled at checkout"
                    : "Include LawHub Advantage at checkout"
                }
              />
              {lawHubAdvantageBundled ? (
                <p className="max-w-[632px] text-center text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#0d47a1]">
                  {LAWHUB_ADVANTAGE_BILLING_NOTE}
                </p>
              ) : (
                <button
                  type="button"
                  className="text-sm font-medium text-[#0d47a1] underline underline-offset-2"
                  onClick={() => setLawHubAdvantageBundled(false)}
                >
                  Toggle to view standard pricing
                </button>
              )}
            </div>
          </header>

          <div className="mt-8 grid items-stretch gap-4 lg:mt-10 lg:grid-cols-3 lg:gap-[18px]">
            {GUEST_PRICING_PLANS.map((plan) => (
              <PricingPlanCard
                key={plan.id}
                plan={plan}
                lawHubAdvantageBundled={lawHubAdvantageBundled}
                onSelectPlan={onSelectPlan}
              />
            ))}
          </div>

          <div className="mt-8 grid items-stretch gap-4 lg:mt-10 lg:grid-cols-3 lg:gap-[18px]">
            {GUEST_PRICING_TRUST_ITEMS.map((item, index) => (
              <div
                key={item.title}
                className="flex h-full min-h-[70px] items-center gap-4 rounded-[16px] border border-[#dfe1e7] bg-white px-4 py-4"
              >
                <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#edf3ff]">
                  <TrustIcon index={index} />
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-[0.28px] text-[#062357]">{item.title}</p>
                  <p className="text-xs tracking-[0.24px] text-[#666d80]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { GuestPricingModal }
