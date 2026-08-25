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

function FreePlanUpgradeCard() {
  return (
    <div className="rounded-[16px] border border-[#b8d4ff] bg-[#edf3ff] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#0d47a1]">Free plan</p>
      <p className="mt-2 text-sm font-semibold leading-[1.4] tracking-[0.28px] text-[#062357]">
        Unlock Performance, Reports, and Score Tracker
      </p>
      <dl className="mt-3 space-y-1 text-xs tracking-[0.24px] text-[#062357]">
        <div className="flex justify-between gap-2">
          <dt className="text-[#666d80]">Trackable score</dt>
          <dd className="font-semibold">70%</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#666d80]">Modules</dt>
          <dd className="font-semibold">20+</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-col gap-2">
        <GuestUpgradeCta variant="sidebar-primary" />
        <GuestUpgradeCta variant="sidebar-secondary" />
      </div>
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
      lockPremiumNav
      beforeFooter={<FreePlanUpgradeCard />}
    />
  )
}

export { GuestFreePlanSidebar }
