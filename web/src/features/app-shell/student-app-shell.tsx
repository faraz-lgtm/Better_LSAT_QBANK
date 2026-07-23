import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { StudentAppHeader } from "@/features/app-shell/student-app-header"
import { PortalChatWidget } from "@/features/app-shell/portal-chat-widget"
import { isPracticeImmersiveRoute } from "@/features/app-shell/practice-immersive-route"
import { RequireLsacContentAccess } from "@/features/app-shell/require-lsac-content-access"
import { StudentAppSidebar } from "@/features/app-shell/student-app-sidebar"
import { StudentEntitlementProvider } from "@/features/app-shell/student-entitlement-context"
import { isGuestFreePlanRoute } from "@/features/guest/diagnostic/guest-free-plan-nav-config"
import { GuestFreePlanSidebar } from "@/features/guest/diagnostic/guest-free-plan-sidebar"
import { GuestUpgradeCta } from "@/features/guest/diagnostic/guest-upgrade-cta"
import { useGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"
import { GuestPricingModalProvider } from "@/features/guest/pricing/guest-pricing-modal-provider"
import {
  StudentPageHeaderSlotProvider,
  useStudentPageHeaderSlotState,
} from "@/features/app-shell/student-page-header-slot"
import { createUsersApi, type AccessState } from "@/lib/api/users"
import { cn } from "@/lib/utils"
import { useLawHubSessionLoginLog } from "@/lib/auth/use-lawhub-session-login-log"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function StudentAppShell() {
  useLawHubSessionLoginLog()
  const location = useLocation()
  const immersive = isPracticeImmersiveRoute(location.pathname)
  const premiumAccount = useGuestPremiumAccount()
  const [accessState, setAccessState] = useState<AccessState | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const { headerActions, breadcrumbTail, setHeaderActions, setBreadcrumbTail } = useStudentPageHeaderSlotState()

  useEffect(() => {
    let alive = true
    const usersApi = createUsersApi(getSupabaseBrowserClient())

    void usersApi
      .getEntitlementState()
      .then((entitlement) => {
        if (!alive) return
        setAccessState(entitlement.accessState)
      })
      .catch(() => {
        if (!alive) return
        setAccessState("PAYMENT_REQUIRED")
      })

    return () => {
      alive = false
    }
  }, [])

  const isUnpaidStudent = accessState === "PAYMENT_REQUIRED"
  const freePlanShell =
    !premiumAccount && (isUnpaidStudent || isGuestFreePlanRoute(location.pathname))

  useLayoutEffect(() => {
    document.documentElement.classList.add("student-shell-active")
    return () => {
      document.documentElement.classList.remove("student-shell-active")
    }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("student-shell-immersive", immersive)
    return () => {
      document.documentElement.classList.remove("student-shell-immersive")
    }
  }, [immersive])

  return (
    <StudentEntitlementProvider>
      <StudentPageHeaderSlotProvider setHeaderActions={setHeaderActions} setBreadcrumbTail={setBreadcrumbTail}>
        <GuestPricingModalProvider>
          <div
            className={cn(
              "flex h-svh min-h-0 overflow-hidden",
              "flex h-svh min-h-0 overflow-hidden bg-[var(--primary-0)]",
            )}
          >
            {immersive ? null : freePlanShell ? (
              <GuestFreePlanSidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
            ) : (
              <StudentAppSidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
            )}
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {immersive ? null : (
                <StudentAppHeader
                  breadcrumbTail={breadcrumbTail}
                  onOpenMobileNav={() => setMobileNavOpen(true)}
                  headerActions={freePlanShell ? <GuestUpgradeCta /> : headerActions}
                />
              )}
              <div className="flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <RequireLsacContentAccess>
                  <Outlet />
                </RequireLsacContentAccess>
              </div>
            </div>
          </div>
          <PortalChatWidget />
        </GuestPricingModalProvider>
      </StudentPageHeaderSlotProvider>
    </StudentEntitlementProvider>
  )
}

export { StudentAppShell }
