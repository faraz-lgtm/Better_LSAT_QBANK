import { useCallback, useLayoutEffect, useState, type ReactNode } from "react"

import { StudentAppHeader } from "@/features/app-shell/student-app-header"
import { GuestFreePlanSidebar } from "@/features/guest/diagnostic/guest-free-plan-sidebar"
import { GuestUpgradeCta } from "@/features/guest/diagnostic/guest-upgrade-cta"
import { GuestPricingModalProvider } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { cn } from "@/lib/utils"

type GuestFreeDashboardShellProps = {
  children: ReactNode
  dashboardHref?: string
}

/** Standalone free-plan shell for preview routes (no auth required). */
function GuestFreeDashboardShell({ children, dashboardHref }: GuestFreeDashboardShellProps) {
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
        <GuestFreePlanSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={closeMobileNav}
          dashboardHref={dashboardHref}
        />
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <StudentAppHeader
            breadcrumbTail={[{ label: "Home", href: dashboardHref ?? "/diagnostic/results/preview" }, { label: "Analytics" }]}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            headerActions={<GuestUpgradeCta />}
          />
          <div className="flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
        </div>
      </div>
    </GuestPricingModalProvider>
  )
}

export { GuestFreeDashboardShell }
