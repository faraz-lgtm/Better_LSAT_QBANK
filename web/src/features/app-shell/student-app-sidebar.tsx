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
  STUDENT_MAIN_NAV_SECTION,
  STUDENT_NAV_ITEM_ICON_SRC,
  STUDENT_NAV_LOGOUT_ICON_SRC,
  STUDENT_NAV_SECTIONS,
  type StudentNavItem,
  type StudentNavItemIconKey,
} from "@/features/app-shell/student-nav-config"
import { useStudentEntitlementOptional, isLsacLockedNavItem } from "@/features/app-shell/student-entitlement-context"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { shouldForceParentNav } from "@/features/student/preptests/preptest-routes"
import { PREP_COURSE_ESSENTIALS_SLUG, PREP_COURSE_NAV_ITEMS } from "@/features/prep-course/lib/prep-course-nav"
import { DiagnosticResultsNavItem } from "@/features/student/diagnostic/diagnostic-results-nav-item"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PREP_COURSE_HREF = "/app/prep-course"

type StudentAppSidebarProps = {
  mobileOpen: boolean
  onMobileClose: () => void
  dashboardHref?: string
  showDiagnosticNav?: boolean
  /** Free-plan: Academy / Insights locked; Prep Course limited to LSAT Essential Course. */
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
  showDiagnosticNav = false,
  lockPremiumNav = false,
  beforeFooter,
}: StudentAppSidebarProps) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const entitlement = useStudentEntitlementOptional()
  const { openLockedContentModal } = useGuestPricingModal()
  const lockLsacNav = !lockPremiumNav && entitlement ? !entitlement.canAccessLsacContent : false
  const dashboardActive = isDashboardActive(pathname)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    onMobileClose()
  }, [onMobileClose, pathname, search])

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }

  function handleLockedContentClick() {
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
            to={STUDENT_DASHBOARD_HREF}
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

        <nav className="student-sidebar-nav flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="student-sidebar-menu">
            <p className="student-sidebar-heading">{STUDENT_MAIN_NAV_SECTION.label}</p>
            <Link
              to={dashboardHref}
              className={cn("student-sidebar-link", dashboardActive && "student-sidebar-link--active")}
              aria-label="Dashboard"
              title="Dashboard"
            >
              <SidebarNavIcon icon={STUDENT_DASHBOARD_ICON} />
              <span className="student-sidebar-label">Dashboard</span>
            </Link>
            {showDiagnosticNav ? (
              <>
                <Link
                  to={STUDENT_DIAGNOSTIC_HREF}
                  className="student-sidebar-link"
                  aria-label="Diagnostic"
                  title="Diagnostic"
                >
                  <SidebarNavIcon icon={STUDENT_DIAGNOSTIC_ICON} />
                  <span className="student-sidebar-label">Diagnostic</span>
                </Link>
                <DiagnosticResultsNavItem
                  showIcon
                  collapsed={collapsed}
                  onExpandSidebar={() => setCollapsed(false)}
                />
              </>
            ) : null}

            {STUDENT_NAV_SECTIONS.map((section) => (
              <div key={section.key} className="student-sidebar-section">
                <p className="student-sidebar-heading">{section.label}</p>
                {section.items.map((item) => {
                  if (lockPremiumNav && !isPrepCourseNavItem(item)) {
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
                      className={cn("student-sidebar-link", active && "student-sidebar-link--active")}
                      aria-label={item.label}
                      title={item.label}
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
        </nav>

        <div className="student-sidebar-footer flex shrink-0 flex-col gap-4 px-4 pb-6">
          {beforeFooter}
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
