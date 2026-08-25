import { useEffect, useState } from "react"
import {
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  Dumbbell,
  FileQuestion,
  FileText,
  Headphones,
  LayoutDashboard,
  LineChart,
  Lock,
  LogOut,
  Moon,
  RotateCcw,
  Search,
  type LucideIcon,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  GUEST_FREE_PLAN_DASHBOARD_HREF,
  GUEST_FREE_PLAN_NAV_SECTIONS,
  GUEST_FREE_PLAN_RESULTS_HREF,
  isGuestFreePlanAnalyticsActive,
  isGuestFreePlanDashboardActive,
} from "@/features/guest/diagnostic/guest-free-plan-nav-config"
import { GuestUpgradeCta } from "@/features/guest/diagnostic/guest-upgrade-cta"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { STUDENT_APP_VERSION } from "@/features/app-shell/student-nav-config"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type GuestFreePlanSidebarProps = {
  mobileOpen: boolean
  onMobileClose: () => void
  dashboardHref?: string
}

const GUEST_FREE_PLAN_NAV_ICONS: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Diagnostic: ClipboardCheck,
  "Diagnostic Results": BarChart3,
  "Practice Exams": BookOpenCheck,
  "Question Bank": Search,
  Drills: Dumbbell,
  Schedule: CalendarDays,
  "Wrong Review": RotateCcw,
  Analytics: LineChart,
  "Trend Line": LineChart,
  Skills: Brain,
  Sections: FileText,
  Question: FileQuestion,
}

function GuestFreePlanNavIcon({ label }: { label: string }) {
  const Icon = GUEST_FREE_PLAN_NAV_ICONS[label] ?? FileText
  return (
    <span className="student-sidebar-link-icon" aria-hidden>
      <Icon className="size-4" strokeWidth={1.9} />
    </span>
  )
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
  const { openLockedContentModal } = useGuestPricingModal()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    onMobileClose()
  }, [onMobileClose, pathname])

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }

  function handleLockedNavClick() {
    onMobileClose()
    openLockedContentModal()
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
          "student-sidebar fixed inset-y-0 left-0 z-50 flex h-svh w-[272px] shrink-0 flex-col border-r border-[color:var(--greyscale-100)] bg-[var(--primary-0)] transition-[width,transform] duration-200 lg:static lg:translate-x-0",
          collapsed && "student-sidebar--collapsed lg:w-[76px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Main navigation"
      >
        <div className="student-shell-top-row student-sidebar-brand-row flex shrink-0 items-center border-b border-[color:var(--greyscale-100)] px-5">
          <Link
            to={dashboardHref}
            className="student-sidebar-brand-link flex min-w-0 flex-1 items-center"
            aria-label="betterLSAT home"
            title="betterLSAT home"
          >
            <img src="/betterLSAT_LOGO.png" alt="betterLSAT" className="h-auto w-[140px] object-contain" />
            <span className="student-sidebar-brand-mark" aria-hidden>
              B
            </span>
          </Link>
          <button
            type="button"
            className="student-sidebar-collapse-toggle hidden size-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--greyscale-100)] bg-[var(--primary-25)] text-[#0d47a1] hover:bg-[#edf3ff] lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </button>
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
                      onClick={handleLockedNavClick}
                      aria-label={item.label}
                      title={item.label}
                      className="student-sidebar-link student-sidebar-link--with-trailing w-full justify-between opacity-80 hover:opacity-100"
                    >
                      <span className="student-sidebar-link-content flex min-w-0 flex-1 items-center gap-2">
                        <GuestFreePlanNavIcon label={item.label} />
                        <span className="student-sidebar-label truncate">{item.label}</span>
                      </span>
                      <Lock className="student-sidebar-lock size-4 shrink-0 text-[#666d80]" aria-hidden />
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.label}
                    to={href}
                    className={cn("student-sidebar-link", active && "student-sidebar-link--active")}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <GuestFreePlanNavIcon label={item.label} />
                    <span className="student-sidebar-label">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="guest-free-plan-sidebar-bottom flex shrink-0 flex-col gap-4 px-4 pb-4">
          <div className="guest-free-plan-upgrade-card rounded-[16px] border border-[#b8d4ff] bg-[#edf3ff] p-4">
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
                aria-label="Support"
                title="Support"
                disabled
              >
                <Headphones className="size-4 shrink-0" aria-hidden />
                <span className="student-sidebar-label">Support</span>
              </button>
              <button
                type="button"
                className="student-sidebar-logout justify-start"
                aria-disabled="true"
                aria-label="Theme"
                title="Theme"
                disabled
              >
                <Moon className="size-4 shrink-0" aria-hidden />
                <span className="student-sidebar-label">Theme</span>
              </button>
              <div className="student-sidebar-logout-row">
                <button
                  type="button"
                  className="student-sidebar-logout"
                  aria-label="Logout"
                  title="Logout"
                  onClick={() => void handleLogout()}
                >
                  <LogOut className="size-4 shrink-0" aria-hidden />
                  <span className="student-sidebar-label">Logout</span>
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
