import { useCallback, useLayoutEffect, useState, type ReactNode } from "react"

import { StudentAppHeader } from "@/features/app-shell/student-app-header"
import { StudentAppSidebar } from "@/features/app-shell/student-app-sidebar"
import { GuestPricingModalProvider } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { cn } from "@/lib/utils"

type GuestPremiumPreviewShellProps = {
  children: ReactNode
}

/** Preview shell with full unlocked student navigation (Figma `19657:47945`). */
function GuestPremiumPreviewShell({ children }: GuestPremiumPreviewShellProps) {
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
        <StudentAppSidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <StudentAppHeader
            breadcrumbTail={[{ label: "Home", href: "/diagnostic/results/preview?premium=1" }, { label: "Analytics" }]}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
          <div className="flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
        </div>
      </div>
    </GuestPricingModalProvider>
  )
}

export { GuestPremiumPreviewShell }
