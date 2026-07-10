import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { GUEST_FREE_PLAN_RESULTS_HREF } from "@/features/guest/diagnostic/guest-free-plan-nav-config"
import { GuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal"
import type { GuestPricingPlanId } from "@/features/guest/pricing/guest-pricing-plans-data"
import { writeGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"

type GuestPricingModalContextValue = {
  openPricingModal: () => void
  closePricingModal: () => void
}

const GuestPricingModalContext = createContext<GuestPricingModalContextValue | null>(null)

function GuestPricingModalProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const openPricingModal = useCallback(() => setOpen(true), [])
  const closePricingModal = useCallback(() => setOpen(false), [])

  const handleSelectPlan = useCallback(
    (planId: GuestPricingPlanId) => {
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
    () => ({ openPricingModal, closePricingModal }),
    [openPricingModal, closePricingModal],
  )

  return (
    <GuestPricingModalContext.Provider value={value}>
      {children}
      <GuestPricingModal open={open} onOpenChange={setOpen} onSelectPlan={handleSelectPlan} />
    </GuestPricingModalContext.Provider>
  )
}

function useGuestPricingModal(): GuestPricingModalContextValue {
  const context = useContext(GuestPricingModalContext)
  if (!context) {
    return {
      openPricingModal: () => undefined,
      closePricingModal: () => undefined,
    }
  }
  return context
}

export { GuestPricingModalProvider, useGuestPricingModal }
