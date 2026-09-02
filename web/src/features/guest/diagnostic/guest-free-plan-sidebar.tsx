import { GuestUpgradeCta } from "@/features/guest/diagnostic/guest-upgrade-cta"
import { StudentAppSidebar } from "@/features/app-shell/student-app-sidebar"
import {
  GUEST_FREE_PLAN_DASHBOARD_HREF,
} from "@/features/guest/diagnostic/guest-free-plan-nav-config"

type GuestFreePlanSidebarProps = {
  mobileOpen: boolean
  onMobileClose: () => void
  dashboardHref?: string
}

/** Figma `20593:121782` — free-plan sidebar upgrade banner */
function FreePlanUpgradeCard() {
  return (
    <div
      className="guest-free-plan-upgrade-card flex w-full flex-col items-center gap-4 overflow-hidden rounded-[20px] p-4 shadow-[0px_1px_2px_rgba(13,13,18,0.06)] [background-image:linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(13,71,161,0.2)_100%),linear-gradient(#edf3ff,#edf3ff)]"
    >
      <p className="m-0 w-full text-xs font-semibold leading-[1.5] tracking-[0.24px] text-[#0d47a1]">
        Unlock Analytics
      </p>
      <p className="m-0 w-full text-xs font-medium leading-[1.5] tracking-[0.24px] text-[#666d80]">
        <span className="font-bold">79% </span>
        Performance, <span className="font-bold">30+</span> Reports, and Score Tracker will be
        available.
      </p>
      <GuestUpgradeCta variant="sidebar-primary" />
    </div>
  )
}

function GuestFreePlanSidebar({
  mobileOpen,
  onMobileClose,
  dashboardHref = GUEST_FREE_PLAN_DASHBOARD_HREF,
}: GuestFreePlanSidebarProps) {
  return (
    <StudentAppSidebar
      mobileOpen={mobileOpen}
      onMobileClose={onMobileClose}
      dashboardHref={dashboardHref}
      showDiagnosticNav
      lockPremiumNav
      beforeFooter={<FreePlanUpgradeCard />}
    />
  )
}

export { GuestFreePlanSidebar }
