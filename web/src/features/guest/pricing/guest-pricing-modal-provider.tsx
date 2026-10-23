import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { useStudentEntitlementOptional } from "@/features/app-shell/student-entitlement-context"
import { GUEST_FREE_PLAN_RESULTS_HREF } from "@/features/guest/diagnostic/guest-free-plan-nav-config"
import {
  isLockedContentVariant,
  type LockedContentVariant,
} from "@/features/guest/pricing/guest-locked-content-copy"
import { GuestLockedContentModal } from "@/features/guest/pricing/guest-locked-content-modal"
import { GuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal"
import {
  FREE_PRICING_PLAN,
  type GuestPricingPlanId,
} from "@/features/guest/pricing/guest-pricing-plans-data"
import { clearGuestPremiumAccount, writeGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"
import {
  checkoutPathForPlan,
  resolveCheckoutSuccessPath,
} from "@/lib/auth/pending-checkout-plan"

const LSAC_LINK_HREF = "/app/lsac-link-step"
const UPGRADE_HANDOFF_HREF = "/app?upgrade=1"

type GuestPricingModalContextValue = {
  openPricingModal: () => void
  openLockedContentModal: (variant?: LockedContentVariant) => void
  closePricingModal: () => void
}

const GuestPricingModalContext = createContext<GuestPricingModalContextValue | null>(null)

type GuestPricingModalProviderProps = {
  children: ReactNode
  /** When true, plan selection goes to authenticated checkout (e.g. intent page for logged-in free users). */
  authenticatedCheckout?: boolean
}

function GuestPricingModalProvider({
  children,
  authenticatedCheckout = false,
}: GuestPricingModalProviderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const entitlement = useStudentEntitlementOptional()
  const isLsacSetupRequired = Boolean(entitlement?.isLsacSetupRequired)
  const [open, setOpen] = useState(false)
  const [lockedContentOpen, setLockedContentOpen] = useState(false)
  const [lockedContentVariant, setLockedContentVariant] = useState<LockedContentVariant>("default")
  const useAuthenticatedCheckout =
    authenticatedCheckout ||
    (location.pathname.startsWith("/app") && !location.pathname.includes("/preview"))

  const openPricingModal = useCallback(() => {
    if (useAuthenticatedCheckout) clearGuestPremiumAccount()
    setOpen(true)
  }, [useAuthenticatedCheckout])
  const openLockedContentModal = useCallback(
    (variant: LockedContentVariant = "default") => {
      if (isLsacSetupRequired) {
        navigate(LSAC_LINK_HREF)
        return
      }
      // Ignore non-variant args (e.g. React mouse events when used as onClick={openLockedContentModal}).
      setLockedContentVariant(isLockedContentVariant(variant) ? variant : "default")
      setLockedContentOpen(true)
    },
    [isLsacSetupRequired, navigate],
  )
  const closePricingModal = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get("upgrade") !== "1") return
    openPricingModal()
    params.delete("upgrade")
    const nextSearch = params.toString()
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
        hash: location.hash,
      },
      { replace: true },
    )
  }, [location.hash, location.pathname, location.search, navigate, openPricingModal])

  const handleSubscribeFromLockedContent = useCallback(() => {
    setLockedContentOpen(false)
    if (isLsacSetupRequired) {
      navigate(LSAC_LINK_HREF)
      return
    }
    setOpen(true)
  }, [isLsacSetupRequired, navigate])

  const handleSelectPlan = useCallback(
    async (planId: GuestPricingPlanId, options?: { includeLawHub: boolean }) => {
      if (useAuthenticatedCheckout) {
        setOpen(false)
        navigate(
          checkoutPathForPlan(planId, {
            includeLawHub: options?.includeLawHub ?? true,
            successPath: resolveCheckoutSuccessPath(location.pathname),
          }),
        )
        return
      }

      writeGuestPremiumAccount(planId)
      setOpen(false)
      if (location.pathname.includes("/preview")) {
        navigate("/diagnostic/results/preview?premium=1", { replace: true })
        return
      }
      navigate(GUEST_FREE_PLAN_RESULTS_HREF, { replace: true })
    },
    [location.pathname, navigate, useAuthenticatedCheckout],
  )

  const value = useMemo(
    () => ({ openPricingModal, openLockedContentModal, closePricingModal }),
    [openPricingModal, openLockedContentModal, closePricingModal],
  )

  return (
    <GuestPricingModalContext.Provider value={value}>
      {children}
      <GuestLockedContentModal
        open={lockedContentOpen}
        onOpenChange={setLockedContentOpen}
        onSubscribe={handleSubscribeFromLockedContent}
        variant={lockedContentVariant}
      />
      <GuestPricingModal
        open={open}
        onOpenChange={setOpen}
        onSelectPlan={handleSelectPlan}
        freeCtaLabel={FREE_PRICING_PLAN.ctaLabel}
        onContinueFree={() => {
          setOpen(false)
          if (useAuthenticatedCheckout) {
            navigate("/app")
            return
          }
          if (location.pathname.includes("/preview")) return
          navigate("/signup")
        }}
      />
    </GuestPricingModalContext.Provider>
  )
}

function useGuestPricingModal(): GuestPricingModalContextValue {
  const context = useContext(GuestPricingModalContext)
  const navigate = useNavigate()
  const fallback = useMemo(
    () => ({
      openPricingModal: () => navigate(UPGRADE_HANDOFF_HREF),
      openLockedContentModal: () => navigate(UPGRADE_HANDOFF_HREF),
      closePricingModal: () => undefined,
    }),
    [navigate],
  )

  return context ?? fallback
}

export { GuestPricingModalProvider, useGuestPricingModal }
