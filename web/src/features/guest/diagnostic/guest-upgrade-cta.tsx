import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { cn } from "@/lib/utils"

type GuestUpgradeCtaProps = {
  variant?: "header" | "banner" | "sidebar-primary" | "sidebar-secondary"
  className?: string
  /** When true, opens the dev preview pricing modal instead of navigating to /app/pricing */
  usePreviewModal?: boolean
}

function useUpgradeAction(usePreviewModal = false) {
  const navigate = useNavigate()
  const location = useLocation()
  const { openPricingModal } = useGuestPricingModal()
  const isPreviewRoute = location.pathname.includes("/preview")

  return () => {
    if (usePreviewModal || isPreviewRoute) {
      openPricingModal()
      return
    }
    navigate("/app/pricing")
  }
}

function GuestUpgradeCta({ variant = "header", className, usePreviewModal = false }: GuestUpgradeCtaProps) {
  const handleUpgrade = useUpgradeAction(usePreviewModal)

  if (variant === "banner") {
    return (
      <Button
        type="button"
        onClick={handleUpgrade}
        className={cn(
          "h-10 shrink-0 rounded-[10px] bg-[#0d47a1] px-5 text-xs font-bold uppercase tracking-[0.48px] text-white hover:bg-[#0b3d8a]",
          className,
        )}
      >
        Subscribe
      </Button>
    )
  }

  if (variant === "sidebar-primary") {
    return (
      <Button
        type="button"
        onClick={handleUpgrade}
        className={cn(
          "h-10 w-full rounded-[10px] bg-[#0d47a1] text-sm font-semibold tracking-[0.28px] text-white hover:bg-[#0b3d8a]",
          className,
        )}
      >
        Upgrade to LSAT+
      </Button>
    )
  }

  if (variant === "sidebar-secondary") {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleUpgrade}
        className={cn(
          "h-10 w-full rounded-[10px] border-[#0d47a1] bg-white text-sm font-semibold tracking-[0.28px] text-[#0d47a1] hover:bg-[#edf3ff]",
          className,
        )}
      >
        Upgrade · $79/mo
      </Button>
    )
  }

  return (
    <Button
      type="button"
      onClick={handleUpgrade}
      className={cn(
        "hidden h-11 rounded-[12px] bg-[#0d47a1] px-5 text-sm font-semibold tracking-[0.28px] text-white hover:bg-[#0b3d8a] sm:inline-flex",
        className,
      )}
    >
      Upgrade to LSAT+
    </Button>
  )
}

function GuestFreePlanUpgradeBanner({ className, usePreviewModal = false }: { className?: string; usePreviewModal?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[16px] border border-[#b8d4ff] bg-[#edf3ff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#062357]">
        Official Performance, Reports, and Score Tracker are now available –{" "}
        <span className="font-semibold text-[#0d47a1]">95.8%</span> for plan transition
      </p>
      <GuestUpgradeCta variant="banner" usePreviewModal={usePreviewModal} />
    </div>
  )
}

function GuestDiagnosticResultsActions({
  usePreviewModal = false,
}: {
  usePreviewModal?: boolean
}) {
  const navigate = useNavigate()
  const handleUpgrade = useUpgradeAction(usePreviewModal)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button
        type="button"
        className="h-11 rounded-[12px] bg-[#0d47a1] px-6 text-sm font-semibold tracking-[0.28px] text-white hover:bg-[#0b3d8a]"
        onClick={handleUpgrade}
      >
        Upgrade to unlock full access
      </Button>
      {!usePreviewModal ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-[12px] border-[#0d47a1] px-6 text-sm font-semibold tracking-[0.28px] text-[#0d47a1] hover:bg-[#edf3ff]"
          onClick={() => navigate("/app")}
        >
          Continue to app
        </Button>
      ) : null}
    </div>
  )
}

export { GuestDiagnosticResultsActions, GuestFreePlanUpgradeBanner, GuestUpgradeCta }
