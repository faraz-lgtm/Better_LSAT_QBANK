import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { GUEST_FREE_PLAN_RESULTS_HREF } from "@/features/guest/diagnostic/guest-free-plan-nav-config"
import { GuestLockedContentModal } from "@/features/guest/pricing/guest-locked-content-modal"
import { GuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal"
import type { GuestPricingPlanId } from "@/features/guest/pricing/guest-pricing-plans-data"
import { clearGuestPremiumAccount, writeGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"
import { checkoutPathForPlan } from "@/lib/auth/pending-checkout-plan"

type GuestPricingModalContextValue = {
  openPricingModal: () => void
  openLockedContentModal: () => void
  closePricingModal: () => void
}

const GuestPricingModalContext = createContext<GuestPricingModalContextValue | null>(null)

function GuestPricingModalProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [lockedContentOpen, setLockedContentOpen] = useState(false)

  const openPricingModal = useCallback(() => {
    if (location.pathname.startsWith("/app")) clearGuestPremiumAccount()
    setOpen(true)
  }, [location.pathname])
  const openLockedContentModal = useCallback(() => setLockedContentOpen(true), [])
  const closePricingModal = useCallback(() => setOpen(false), [])

  const handleSubscribeFromLockedContent = useCallback(() => {
    setLockedContentOpen(false)
    setOpen(true)
  }, [])

  const handleSelectPlan = useCallback(
    async (planId: GuestPricingPlanId, options?: { includeLawHub: boolean }) => {
      if (location.pathname.startsWith("/app") && !location.pathname.includes("/preview")) {
        setOpen(false)
        navigate(
          checkoutPathForPlan(planId, {
            includeLawHub: options?.includeLawHub ?? true,
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
    [location.pathname, navigate],
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
      />
      <GuestPricingModal
        open={open}
        onOpenChange={setOpen}
        onSelectPlan={handleSelectPlan}
        freeCtaLabel={location.pathname.startsWith("/app") ? "Continue Free" : "Create Free Account"}
        onContinueFree={() => {
          setOpen(false)
          if (location.pathname.startsWith("/app")) {
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
      openPricingModal: () => navigate("/app/pricing"),
      openLockedContentModal: () => navigate("/app/pricing"),
      closePricingModal: () => undefined,
    }),
    [navigate],
  )

  return context ?? fallback
}

export { GuestPricingModalProvider, useGuestPricingModal }
