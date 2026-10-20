import { useEffect, useState, type ReactNode } from "react"
import { ChevronDown, ChevronsLeft, ChevronsRight, Lock } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  isDashboardActive,
  isNavItemActive,
  STUDENT_APP_VERSION,
  STUDENT_DASHBOARD_HREF,
  STUDENT_DASHBOARD_ICON,
  STUDENT_DIAGNOSTIC_HREF,
  STUDENT_DIAGNOSTIC_ICON,
  STUDENT_DIAGNOSTIC_NAV_SECTION,
  STUDENT_GET_STARTED_ICON,
  STUDENT_GET_STARTED_LABEL,
  STUDENT_MAIN_NAV_SECTION,
  STUDENT_NAV_ITEM_ICON_SRC,
  STUDENT_NAV_LOGOUT_ICON_SRC,
  STUDENT_NAV_SECTIONS,
  type StudentNavItem,
  type StudentNavItemIconKey,
} from "@/features/app-shell/student-nav-config"
import { useStudentEntitlementOptional, isLsacLockedNavItem } from "@/features/app-shell/student-entitlement-context"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { PREPTEST_LIST_HREF, shouldForceParentNav } from "@/features/student/preptests/preptest-routes"
import { PREP_COURSE_ESSENTIALS_SLUG, PREP_COURSE_NAV_ITEMS } from "@/features/prep-course/lib/prep-course-nav"
import {
  DIAGNOSTIC_EXPLANATIONS_HREF,
  isDiagnosticExplanationsPath,
} from "@/features/student/diagnostic/diagnostic-explanations-routes"
import { DiagnosticResultsNavItem } from "@/features/student/diagnostic/diagnostic-results-nav-item"
import { cn } from "@/lib/utils"
import { resetUser } from "@/lib/analytics/posthog"
import { startProduktlyTour } from "@/lib/analytics/produktly"
import { PRODUKTLY_PRODUCT_TOUR_ID } from "@/lib/analytics/produktly-widgets"
import { prefetchExplanationList } from "@/features/student/explanation-detail/prefetch-explanation-list"
import { prefetchPrepTestPool } from "@/features/student/preptests/prefetch-prep-test-pool"
import { clearStudentSessionCaches } from "@/lib/auth/clear-student-session-caches"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PREP_COURSE_HREF = "/app/prep-course"

/** Stable Produktly CSS selectors: `[data-tour-target="…"]` (tour 11289). */
const TOUR_TARGET = {
  sidebarBrand: "sidebar-brand",
  sidebarMenu: "sidebar-menu",
  getStarted: "nav-get-started",
  dashboard: "nav-dashboard",
  diagnosticTest: "nav-diagnostic-test",
  diagnosticExplanation: "nav-diagnostic-explanation",
} as const

const NAV_HREF_TOUR_TARGETS: Record<string, string> = {
  [PREP_COURSE_HREF]: "nav-prep-course",
  "/app/learn/explanations": "nav-explanations",
  "/app/practice/drills": "nav-drills",
  "/app/practice/sections": "nav-sections",
  [PREPTEST_LIST_HREF]: "nav-preptest",
  "/app/analytics": "nav-overview",
  "/app/analytics/drills": "nav-insights-drills",
  "/app/analytics/sections": "nav-insights-sections",
  "/app/analytics/preptests": "nav-insights-preptest",
  "/app/feedback": "nav-feedback",
  "/app/roadmap": "nav-roadmap",
}

function tourTargetForNavHref(href: string): string {
  return (
    NAV_HREF_TOUR_TARGETS[href] ??
    `nav-${href.replace(/^\/app\//, "").replace(/\//g, "-")}`
  )
}

type StudentAppSidebarProps = {
  mobileOpen: boolean
  onMobileClose: () => void
  dashboardHref?: string
  showDiagnosticNav?: boolean
  /** Free-plan: Academy / Insights locked; Prep Course limited to LSAT Essentials Course. */
  lockPremiumNav?: boolean
  beforeFooter?: ReactNode
}

function SidebarNavIcon({ icon }: { icon: StudentNavItemIconKey }) {
  return (
    <span className="student-sidebar-link-icon" aria-hidden>
      <img src={STUDENT_NAV_ITEM_ICON_SRC[icon]} alt="" width={16} height={16} />
    </span>
  )
}

function isPrepCourseNavItem(item: StudentNavItem): boolean {
  return item.href === PREP_COURSE_HREF
}

/** Free-plan: keep Prep Course + community links clickable (Diagnostic items live under DIAGNOSTIC). */
function isUnlockedOnFreePlan(item: StudentNavItem): boolean {
  return (
    isPrepCourseNavItem(item) ||
    item.href === "/app/feedback" ||
    item.href === "/app/roadmap"
  )
}

function isPrepCourseRoute(pathname: string): boolean {
  return pathname === PREP_COURSE_HREF || pathname.startsWith(`${PREP_COURSE_HREF}/`)
}

function isCourseNavActive(pathname: string, courseSlug: string): boolean {
  const courseBase = `${PREP_COURSE_HREF}/${courseSlug}`
  return pathname === courseBase || pathname.startsWith(`${courseBase}/`)
}

function PrepCourseNavItem({
  item,
  pathname,
  collapsed,
  onExpandSidebar,
  lockNonEssentialCourses = false,
  onLockedCourseClick,
}: {
  item: StudentNavItem
  pathname: string
  collapsed: boolean
  onExpandSidebar: () => void
  lockNonEssentialCourses?: boolean
  onLockedCourseClick?: () => void
}) {
  const onPrepCourseRoute = isPrepCourseRoute(pathname)
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null)

  const expanded = manualExpanded ?? onPrepCourseRoute
  const parentActive = onPrepCourseRoute

  useEffect(() => {
    if (onPrepCourseRoute) setManualExpanded(null)
  }, [onPrepCourseRoute])

  return (
    <div className="student-sidebar-expandable">
      <button
        type="button"
        data-tour-target={tourTargetForNavHref(item.href)}
        className={cn(
          "student-sidebar-link student-sidebar-link--with-trailing w-full justify-between",
          parentActive && "student-sidebar-link--active",
        )}
        aria-expanded={collapsed ? false : expanded}
        aria-label={item.label}
        title={item.label}
        onClick={() => {
          if (collapsed) {
            onExpandSidebar()
            setManualExpanded(true)
            return
          }
          setManualExpanded(!expanded)
        }}
      >
        <span className="student-sidebar-link-content flex min-w-0 items-center gap-2.5">
          <SidebarNavIcon icon={item.icon} />
          <span className="student-sidebar-label truncate">{item.label}</span>
        </span>
        <ChevronDown
          className={cn(
            "student-sidebar-chevron size-4 shrink-0 text-[#666d80] transition-transform duration-150",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {!collapsed && expanded ? (
        <div className="student-sidebar-subnav" role="group" aria-label="Prep courses">
          {PREP_COURSE_NAV_ITEMS.map((course) => {
            const href = `${PREP_COURSE_HREF}/${course.slug}`
            const active = isCourseNavActive(pathname, course.slug)
            const locked = lockNonEssentialCourses && course.slug !== PREP_COURSE_ESSENTIALS_SLUG
            if (locked) {
              return (
                <button
                  key={course.slug}
                  type="button"
                  aria-label={`${course.title} (locked)`}
                  title={`${course.title} (locked)`}
                  onClick={onLockedCourseClick}
                  className="student-sidebar-link student-sidebar-sublink student-sidebar-link--locked student-sidebar-link--with-trailing w-full justify-between"
                >
                  <span className="truncate">{course.title}</span>
                  <Lock className="student-sidebar-lock size-4 shrink-0 text-[#666d80]" aria-hidden />
                </button>
              )
            }
            return (
              <Link
                key={course.slug}
                to={href}
                className={cn(
                  "student-sidebar-link student-sidebar-sublink",
                  active && "student-sidebar-link--active",
                )}
                title={course.title}
              >
                <span className="truncate">{course.title}</span>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function getLockedPremiumNavLabel(item: StudentNavItem): string {
  return item.href === "/app/analytics" ? "Analytics" : item.label
}

function LockedPremiumNavItem({ item, onLockedClick }: { item: StudentNavItem; onLockedClick: () => void }) {
  const label = getLockedPremiumNavLabel(item)

  return (
    <button
      type="button"
      data-tour-target={tourTargetForNavHref(item.href)}
      aria-label={`${label} (locked)`}
      title={`${label} (locked)`}
      onClick={onLockedClick}
      className="student-sidebar-link student-sidebar-link--locked student-sidebar-link--with-trailing w-full justify-between"
    >
      <span className="student-sidebar-link-content flex min-w-0 items-center gap-2.5">
        <SidebarNavIcon icon={item.icon} />
        <span className="student-sidebar-label truncate">{label}</span>
      </span>
      <Lock className="student-sidebar-lock size-4 shrink-0 text-[#666d80]" aria-hidden />
    </button>
  )
}

function StudentAppSidebar({
  mobileOpen,
  onMobileClose,
  dashboardHref = STUDENT_DASHBOARD_HREF,
  showDiagnosticNav = true,
  lockPremiumNav = false,
  beforeFooter,
}: StudentAppSidebarProps) {
  const { pathname, search, state } = useLocation()
  const navigate = useNavigate()
  const entitlement = useStudentEntitlementOptional()
  const { openLockedContentModal } = useGuestPricingModal()
  const lockLsacNav = !lockPremiumNav && entitlement ? !entitlement.canAccessLsacContent : false
  const dashboardActive = isDashboardActive(pathname)
  const [collapsed, setCollapsed] = useState(false)
  const pendingProduktlyTour =
    typeof state === "object" &&
    state !== null &&
    "startProduktlyTour" in state &&
    Boolean((state as { startProduktlyTour?: unknown }).startProduktlyTour)

  useEffect(() => {
    onMobileClose()
  }, [onMobileClose, pathname, search])

  useEffect(() => {
    if (!pendingProduktlyTour || !isDashboardActive(pathname)) return
    let cancelled = false
    let clearStateTimer: number | undefined
    // Defer past paint so dashboard tour targets exist; do not clear router
    // state in the same turn as startTour — that SPA replace can cancel the
    // Produktly card before the iframe mounts (intermittent empty root).
    const startTimer = window.setTimeout(() => {
      if (cancelled) return
      startProduktlyTour({
        tourId: PRODUKTLY_PRODUCT_TOUR_ID,
        clearProgress: true,
      })
      clearStateTimer = window.setTimeout(() => {
        if (cancelled) return
        navigate(`${pathname}${search}`, { replace: true, state: null })
      }, 400)
    }, 50)
    return () => {
      cancelled = true
      window.clearTimeout(startTimer)
      if (clearStateTimer !== undefined) window.clearTimeout(clearStateTimer)
    }
  }, [navigate, pathname, pendingProduktlyTour, search])

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    clearStudentSessionCaches()
    resetUser()
    navigate("/login", { replace: true })
  }

  function handleLockedContentClick() {
    onMobileClose()
    openLockedContentModal()
  }

  function handleGetStartedClick() {
    onMobileClose()
    if (isDashboardActive(pathname)) {
      startProduktlyTour({
        tourId: PRODUKTLY_PRODUCT_TOUR_ID,
        clearProgress: true,
      })
      return
    }
    navigate(STUDENT_DASHBOARD_HREF, { state: { startProduktlyTour: true } })
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
        <div
          className="student-shell-top-row student-sidebar-brand-row flex shrink-0 items-center border-b border-[color:var(--greyscale-100)] px-5"
          data-tour-target={TOUR_TARGET.sidebarBrand}
        >
          <Link
            to={STUDENT_DASHBOARD_HREF}
            className="student-sidebar-brand-link flex min-w-0 flex-1 items-center"
            aria-label="betterLSAT home"
            title="betterLSAT home"
          >
            <img
              src="/betterLSAT_LOGO.png"
              alt="betterLSAT"
              className={cn(
                "h-auto w-[140px] object-contain dark:brightness-0 dark:invert",
                collapsed && "lg:hidden",
              )}
            />
            <img
              src="/betterLSAT_icon.png"
              alt=""
              width={32}
              height={32}
              className={cn(
                "student-sidebar-brand-mark",
                collapsed ? "hidden lg:block" : "hidden",
              )}
              aria-hidden
            />
          </Link>
          <button
            type="button"
            className="student-sidebar-collapse-toggle hidden size-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--greyscale-100)] bg-[var(--primary-25)] text-[color:var(--primary)] hover:bg-[color:var(--primary-25)] lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </button>
        </div>

        <nav className="student-sidebar-nav flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="student-sidebar-menu shrink-0" data-tour-target={TOUR_TARGET.sidebarMenu}>
            {PRODUKTLY_PRODUCT_TOUR_ID > 0 ? (
              <button
                type="button"
                data-tour-target={TOUR_TARGET.getStarted}
                className="student-sidebar-link w-full"
                aria-label={STUDENT_GET_STARTED_LABEL}
                title={STUDENT_GET_STARTED_LABEL}
                onClick={handleGetStartedClick}
              >
                <SidebarNavIcon icon={STUDENT_GET_STARTED_ICON} />
                <span className="student-sidebar-label">{STUDENT_GET_STARTED_LABEL}</span>
              </button>
            ) : null}
            <p className="student-sidebar-heading">{STUDENT_MAIN_NAV_SECTION.label}</p>
            <Link
              to={dashboardHref}
              data-tour-target={TOUR_TARGET.dashboard}
              className={cn("student-sidebar-link", dashboardActive && "student-sidebar-link--active")}
              aria-label="Dashboard"
              title="Dashboard"
            >
              <SidebarNavIcon icon={STUDENT_DASHBOARD_ICON} />
              <span className="student-sidebar-label">Dashboard</span>
            </Link>

            {showDiagnosticNav ? (
              <div className="student-sidebar-section">
                <p className="student-sidebar-heading">{STUDENT_DIAGNOSTIC_NAV_SECTION.label}</p>
                <Link
                  to={STUDENT_DIAGNOSTIC_HREF}
                  data-tour-target={TOUR_TARGET.diagnosticTest}
                  className="student-sidebar-link"
                  aria-label="Diagnostic Test"
                  title="Diagnostic Test"
                >
                  <SidebarNavIcon icon={STUDENT_DIAGNOSTIC_ICON} />
                  <span className="student-sidebar-label">Diagnostic Test</span>
                </Link>
                <DiagnosticResultsNavItem
                  showIcon
                  collapsed={collapsed}
                  onExpandSidebar={() => setCollapsed(false)}
                />
                <Link
                  to={DIAGNOSTIC_EXPLANATIONS_HREF}
                  data-tour-target={TOUR_TARGET.diagnosticExplanation}
                  className={cn(
                    "student-sidebar-link",
                    isDiagnosticExplanationsPath(pathname) && "student-sidebar-link--active",
                  )}
                  aria-label="Diagnostic Explanation"
                  title="Diagnostic Explanation"
                >
                  <SidebarNavIcon icon="explanations" />
                  <span className="student-sidebar-label">Diagnostic Explanation</span>
                </Link>
              </div>
            ) : null}

            {STUDENT_NAV_SECTIONS.map((section) => (
              <div key={section.key} className="student-sidebar-section">
                <p className="student-sidebar-heading">{section.label}</p>
                {section.items.map((item) => {
                  const tourTarget = tourTargetForNavHref(item.href)

                  if (lockPremiumNav && !isUnlockedOnFreePlan(item)) {
                    return <LockedPremiumNavItem key={item.href} item={item} onLockedClick={handleLockedContentClick} />
                  }

                  if (isPrepCourseNavItem(item)) {
                    return (
                      <PrepCourseNavItem
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        collapsed={collapsed}
                        onExpandSidebar={() => setCollapsed(false)}
                        lockNonEssentialCourses={lockPremiumNav}
                        onLockedCourseClick={handleLockedContentClick}
                      />
                    )
                  }

                  const siblingHrefs = section.items.map((entry) => entry.href)
                  const active = isNavItemActive(pathname, item.href, search, siblingHrefs)

                  if (lockLsacNav && isLsacLockedNavItem(item.href)) {
                    return (
                      <button
                        key={item.href}
                        type="button"
                        data-tour-target={tourTarget}
                        aria-disabled="true"
                        aria-label={item.label}
                        title="Link your LawHub coach to unlock"
                        onClick={handleLockedContentClick}
                        className="student-sidebar-link student-sidebar-link--with-trailing w-full justify-between opacity-70 hover:opacity-100"
                      >
                        <span className="student-sidebar-link-content flex min-w-0 items-center gap-2.5">
                          <SidebarNavIcon icon={item.icon} />
                          <span className="student-sidebar-label truncate">{item.label}</span>
                        </span>
                        <Lock className="student-sidebar-lock size-4 shrink-0 text-[#666d80]" aria-hidden />
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      data-tour-target={tourTarget}
                      className={cn("student-sidebar-link", active && "student-sidebar-link--active")}
                      aria-label={item.label}
                      title={item.label}
                      onPointerEnter={() => {
                        if (item.href === "/app/learn/explanations") prefetchExplanationList()
                        if (item.href === PREPTEST_LIST_HREF) prefetchPrepTestPool()
                      }}
                      onFocus={() => {
                        if (item.href === "/app/learn/explanations") prefetchExplanationList()
                        if (item.href === PREPTEST_LIST_HREF) prefetchPrepTestPool()
                      }}
                      onClick={(event) => {
                        if (!shouldForceParentNav(pathname, item.href)) return
                        event.preventDefault()
                        navigate(item.href)
                      }}
                    >
                      <SidebarNavIcon icon={item.icon} />
                      <span className="student-sidebar-label">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
          {beforeFooter}
        </nav>

        <div className="student-sidebar-footer flex shrink-0 flex-col gap-4 px-4 pb-6">
          <div className="student-sidebar-logout-row">
            <button
              type="button"
              className="student-sidebar-logout"
              aria-label="Logout"
              title="Logout"
              onClick={() => void handleLogout()}
            >
              <span className="student-sidebar-logout-icon" aria-hidden>
                <img src={STUDENT_NAV_LOGOUT_ICON_SRC} alt="" width={16} height={16} />
              </span>
              <span className="student-sidebar-label">Logout</span>
            </button>
            <span className="student-sidebar-version">Version {STUDENT_APP_VERSION}</span>
          </div>
        </div>
      </aside>
    </>
  )
}

export { StudentAppSidebar }
