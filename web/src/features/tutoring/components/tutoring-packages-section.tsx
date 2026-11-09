import { useState } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PackageBookingModal } from "@/features/tutoring/components/package-booking-modal"
import type { TutoringPackage } from "@/features/tutoring/lib/types"
import { cn } from "@/lib/utils"

type TutoringPackagesSectionProps = {
  packages: TutoringPackage[]
  title: string
  subtitle?: string
  ctaLabel?: string
  helperLinkLabel: string
  onCtaClick?: () => void
  onHelperClick?: () => void
  selectedPackageId?: TutoringPackage["id"]
  onSelectPackage?: (id: TutoringPackage["id"]) => void
}

function TutoringPackagesSection({
  packages,
  title,
  subtitle = "Private 1-on-1 sessions. Packages never expire.",
  ctaLabel,
  helperLinkLabel,
  onCtaClick,
  onHelperClick,
  selectedPackageId,
  onSelectPackage,
}: TutoringPackagesSectionProps) {
  const [bookingPackage, setBookingPackage] = useState<TutoringPackage | null>(null)

  return (
    <section className="flex w-full flex-col gap-4">
      <div>
        <h2 className="text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)]">{title}</h2>
        <p className="mt-1.5 text-sm tracking-[0.02em] text-[var(--greyscale-500)]">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {packages.map((pkg) => {
          const selected = selectedPackageId === pkg.id || (!selectedPackageId && pkg.popular)
          return (
            <div
              key={pkg.id}
              className={cn(
                "relative flex h-full cursor-pointer flex-col gap-3.5 rounded-[16px] border bg-[var(--greyscale-0)] px-[22px] py-6 text-left transition-shadow",
                selected
                  ? "border-2 border-[var(--primary)] shadow-[0_8px_24px_rgba(13,71,161,0.12)]"
                  : "border-[var(--greyscale-100)] hover:border-[var(--primary)]/40",
              )}
              onClick={() => onSelectPackage?.(pkg.id)}
            >
              {pkg.popular ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-t-[8px] bg-[var(--primary)] px-3 py-1 text-[13px] font-bold tracking-[0.02em] text-white">
                  Most Popular
                </span>
              ) : null}
              <p className="text-sm font-semibold tracking-[0.02em] text-[var(--primary)]">{pkg.name}</p>
              <div className="flex items-end gap-2">
                <span className="text-[32px] font-extrabold leading-none text-[var(--greyscale-800)]">
                  {pkg.price}
                </span>
                <span className="pb-1 text-base font-semibold tracking-[0.02em] text-[var(--greyscale-500)] line-through">
                  {pkg.compareAtPrice}
                </span>
              </div>
              {pkg.saveLabel ? (
                <span className="w-fit rounded-full bg-[#effefa] px-2.5 py-1 text-xs font-bold tracking-[0.02em] text-[#064e3b]">
                  {pkg.saveLabel}
                </span>
              ) : (
                <span className="h-7" aria-hidden />
              )}
              <p className="border-b border-[var(--primary-25)] pb-3.5 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
                {pkg.description}
              </p>
              <ul className="flex flex-col gap-2.5">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-xs tracking-[0.02em] text-[var(--greyscale-800)]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--primary)]" strokeWidth={2.5} aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-auto hidden h-11 w-full items-center justify-center rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 text-xs font-bold tracking-[0.01em] text-[var(--primary)]"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onSelectPackage?.(pkg.id)
                  setBookingPackage(pkg)
                }}
              >
                {pkg.ctaLabel}
              </button>
            </div>
          )
        })}
      </div>

      {ctaLabel ? (
        <div className="flex justify-center pt-2">
          <Button type="button" size="lg" className="h-12 min-w-[194px] rounded-[10px] px-4" onClick={onCtaClick}>
            {ctaLabel}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-[14px] border border-[var(--primary-25)] bg-[var(--greyscale-0)] px-6 py-[18px] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.02em] text-[var(--color-student-heading)]">
            Not sure which package fits?
          </p>
          <p className="mt-1 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
            That is exactly what the strategy call is for. Share your goals first, then choose the package with more
            confidence.
          </p>
        </div>
        <button
          type="button"
          onClick={onHelperClick}
          className="shrink-0 text-sm font-semibold tracking-[0.02em] text-[var(--primary)] underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--greyscale-300)]"
        >
          {helperLinkLabel}
        </button>
      </div>

      <PackageBookingModal
        open={bookingPackage != null}
        onOpenChange={(open) => {
          if (!open) setBookingPackage(null)
        }}
        title={bookingPackage?.ctaLabel ?? "Book a session"}
        bookingUrl={bookingPackage?.bookingUrl ?? null}
      />
    </section>
  )
}

export { TutoringPackagesSection }
