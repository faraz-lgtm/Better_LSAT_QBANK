import { useCallback, useLayoutEffect, useState, type ReactNode } from "react"

import { StudentAppHeader } from "@/features/app-shell/student-app-header"
import { StudentAppSidebar } from "@/features/app-shell/student-app-sidebar"
import { GuestUpgradeCta } from "@/features/guest/diagnostic/guest-upgrade-cta"
import { GuestPricingModalProvider } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { cn } from "@/lib/utils"

type GuestPremiumLsacSetupShellProps = {
  children: ReactNode
  dashboardHref?: string
}

/**
 * Standalone premium shell for preview routes where the user is subscribed
 * but LawHub / LSAC is not linked yet (no auth required).
 */
function GuestPremiumLsacSetupShell({
  children,
  dashboardHref = "/dashboard/lsac-setup/preview",
}: GuestPremiumLsacSetupShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])

  useLayoutEffect(() => {
    document.documentElement.classList.add("student-shell-active")
    return () => {
      document.documentElement.classList.remove("student-shell-active")
    }
  }, [])

  return (
    <GuestPricingModalProvider>
      <div className={cn("flex h-svh min-h-0 overflow-hidden bg-[var(--primary-0)]")}>
        <StudentAppSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={closeMobileNav}
          dashboardHref={dashboardHref}
        />
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <StudentAppHeader
            onOpenMobileNav={() => setMobileNavOpen(true)}
            headerActions={<GuestUpgradeCta />}
          />
          <div className="flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
        </div>
      </div>
    </GuestPricingModalProvider>
  )
}

export { GuestPremiumLsacSetupShell }
