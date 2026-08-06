import { useCallback, useLayoutEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { StudentAppHeader } from "@/features/app-shell/student-app-header"
import { PortalChatWidget } from "@/features/app-shell/portal-chat-widget"
import { isPracticeImmersiveRoute } from "@/features/app-shell/practice-immersive-route"
import { RequireLsacContentAccess } from "@/features/app-shell/require-lsac-content-access"
import { StudentAppSidebar } from "@/features/app-shell/student-app-sidebar"
import {
  StudentEntitlementProvider,
  useStudentEntitlement,
} from "@/features/app-shell/student-entitlement-context"
import { resolveStudentShellVariant } from "@/features/app-shell/student-shell-plan-variant"
import { GuestFreePlanSidebar } from "@/features/guest/diagnostic/guest-free-plan-sidebar"
import { GuestUpgradeCta } from "@/features/guest/diagnostic/guest-upgrade-cta"
import { useGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"
import { GuestPricingModalProvider } from "@/features/guest/pricing/guest-pricing-modal-provider"
import {
  StudentPageHeaderSlotProvider,
  useStudentPageHeaderSlotState,
} from "@/features/app-shell/student-page-header-slot"
import { cn } from "@/lib/utils"
import { useLawHubSessionLoginLog } from "@/lib/auth/use-lawhub-session-login-log"

function StudentAppShellLayout() {
  useLawHubSessionLoginLog()
  const location = useLocation()
  const immersive = isPracticeImmersiveRoute(location.pathname)
  const premiumAccount = useGuestPremiumAccount()
  const { entitlement } = useStudentEntitlement()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const { headerActions, breadcrumbTail, setHeaderActions, setBreadcrumbTail } = useStudentPageHeaderSlotState()

  const freePlanShell =
    resolveStudentShellVariant({
      accessState: entitlement?.accessState ?? null,
      hasGuestPremiumAccount: Boolean(premiumAccount),
    }) === "free-plan"

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
        <PortalChatWidget enabled={!immersive} />
      </GuestPricingModalProvider>
    </StudentPageHeaderSlotProvider>
  )
}

function StudentAppShell() {
  return (
    <StudentEntitlementProvider>
      <StudentAppShellLayout />
    </StudentEntitlementProvider>
  )
}

export { StudentAppShell }
