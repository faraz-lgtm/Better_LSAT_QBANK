import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { GUEST_FREE_PLAN_RESULTS_HREF } from "@/features/guest/diagnostic/guest-free-plan-nav-config"
import { GuestLockedContentModal } from "@/features/guest/pricing/guest-locked-content-modal"
import { GuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal"
import type { GuestPricingPlanId } from "@/features/guest/pricing/guest-pricing-plans-data"
import { clearGuestPremiumAccount, writeGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"
import { createBillingApi } from "@/lib/api/billing"
import { createUsersApi } from "@/lib/api/users"
import { readDiagnosticFunnelState } from "@/lib/auth/diagnostic-intent"
import { logRouteRedirect } from "@/lib/auth/log-route-redirect"
import { emailAllowsLawHub, profileHasLawHubName } from "@/lib/lawhub-identity"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatEdgeFunctionError } from "@/lib/supabase/format-call-error"

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
        const supabase = getSupabaseBrowserClient()
        const billingApi = createBillingApi(supabase)
        const usersApi = createUsersApi(supabase)

        const profile = await usersApi.getMyProfile()
        if (!profile) {
          setOpen(false)
          navigate("/login", { replace: true })
          return
        }

        if (!emailAllowsLawHub(profile.email)) {
          throw new Error('Your email uses a "+" tag, which LSAC does not allow. Update your account email before checkout.')
        }

        if (!profileHasLawHubName(profile)) {
          logRouteRedirect("/app/pricing", "/onboarding", "missing LawHub first/last name before checkout")
          setOpen(false)
          navigate("/onboarding", { replace: true })
          return
        }

        try {
          const funnel = readDiagnosticFunnelState()
          const successPath = funnel.completedDiagnostic ? "/app/diagnostic/results?checkout=success" : undefined
          const url = await billingApi.createCheckoutSession(planId, {
            includeLawHub: options?.includeLawHub ?? true,
            successPath,
          })
          window.location.assign(url)
        } catch (checkoutError) {
          const message =
            checkoutError instanceof Error
              ? formatEdgeFunctionError(checkoutError)
              : "Unable to start checkout."
          if (message.includes("First and last name") || message.includes("LAWHUB_NAME")) {
            logRouteRedirect("/app/pricing", "/onboarding", "server rejected checkout: name required")
            setOpen(false)
            navigate("/onboarding", { replace: true })
            return
          }
          throw new Error(message.includes("not configured") ? "Billing is not configured on the server." : message)
        }
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
      <GuestPricingModal open={open} onOpenChange={setOpen} onSelectPlan={handleSelectPlan} />
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
