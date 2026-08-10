import { useEffect } from "react"
import { Headphones, Lock, LogOut, Moon } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  GUEST_FREE_PLAN_DASHBOARD_HREF,
  GUEST_FREE_PLAN_NAV_SECTIONS,
  GUEST_FREE_PLAN_PRICING_HREF,
  GUEST_FREE_PLAN_RESULTS_HREF,
  isGuestFreePlanAnalyticsActive,
  isGuestFreePlanDashboardActive,
} from "@/features/guest/diagnostic/guest-free-plan-nav-config"
import { GuestUpgradeCta } from "@/features/guest/diagnostic/guest-upgrade-cta"
import { STUDENT_APP_VERSION } from "@/features/app-shell/student-nav-config"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type GuestFreePlanSidebarProps = {
  mobileOpen: boolean
  onMobileClose: () => void
  dashboardHref?: string
}

function GuestFreePlanSidebar({
  mobileOpen,
  onMobileClose,
  dashboardHref = GUEST_FREE_PLAN_DASHBOARD_HREF,
}: GuestFreePlanSidebarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const analyticsActive = isGuestFreePlanAnalyticsActive(pathname)
  const dashboardActive = isGuestFreePlanDashboardActive(pathname)

  useEffect(() => {
    onMobileClose()
  }, [onMobileClose, pathname])

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={cn(
          "student-sidebar fixed inset-y-0 left-0 z-50 flex h-svh w-[272px] shrink-0 flex-col border-r border-[color:var(--greyscale-100)] bg-[var(--primary-0)] transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Main navigation"
      >
        <div className="student-shell-top-row flex shrink-0 items-center border-b border-[color:var(--greyscale-100)] px-5">
          <Link
            to={dashboardHref}
            className="flex w-full items-center"
            aria-label="betterLSAT home"
          >
            <img src="/betterLSAT_LOGO.png" alt="betterLSAT" className="h-auto w-[140px] object-contain" />
          </Link>
        </div>

        <nav className="student-sidebar-nav flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-2">
          {GUEST_FREE_PLAN_NAV_SECTIONS.map((section) => (
            <div key={section.key} className="student-sidebar-section">
              <p className="student-sidebar-heading">{section.label}</p>
              {section.items.map((item) => {
                const isAnalytics = item.label === "Analytics"
                const isDashboard = item.label === "Dashboard"
                const active =
                  (isAnalytics && analyticsActive) ||
                  (isDashboard && dashboardActive) ||
                  (item.label === "Diagnostic Results" && pathname.startsWith(GUEST_FREE_PLAN_RESULTS_HREF))
                const href = item.href ?? dashboardHref

                if (item.locked) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => navigate(GUEST_FREE_PLAN_PRICING_HREF)}
                      className="student-sidebar-link w-full justify-between pr-4 opacity-80 hover:opacity-100"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate">{item.label}</span>
                      </span>
                      <Lock className="size-4 shrink-0 text-[#666d80]" aria-hidden />
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.label}
                    to={href}
                    className={cn("student-sidebar-link", active && "student-sidebar-link--active")}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="flex shrink-0 flex-col gap-4 px-4 pb-4">
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

          <div className="student-sidebar-footer flex shrink-0 pb-2">
            <div className="flex w-full flex-col gap-2">
              <button
                type="button"
                className="student-sidebar-logout justify-start"
                aria-disabled="true"
                disabled
              >
                <Headphones className="size-4 shrink-0" aria-hidden />
                <span>Support</span>
              </button>
              <button
                type="button"
                className="student-sidebar-logout justify-start"
                aria-disabled="true"
                disabled
              >
                <Moon className="size-4 shrink-0" aria-hidden />
                <span>Theme</span>
              </button>
              <div className="student-sidebar-logout-row">
                <button
                  type="button"
                  className="student-sidebar-logout"
                  onClick={() => void handleLogout()}
                >
                  <LogOut className="size-4 shrink-0" aria-hidden />
                  <span>Logout</span>
                </button>
                <span className="student-sidebar-version">Version {STUDENT_APP_VERSION}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export { GuestFreePlanSidebar }
