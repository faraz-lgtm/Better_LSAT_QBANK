import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Lock } from "lucide-react"
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
import { shouldForceParentNav } from "@/features/student/preptests/preptest-routes"
import { createPrepCourseApi, type PrepCourse } from "@/lib/api/prep-course"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PREP_COURSE_HREF = "/app/prep-course"

type StudentAppSidebarProps = {
  mobileOpen: boolean
  onMobileClose: () => void
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
}: {
  item: StudentNavItem
  pathname: string
}) {
  const onPrepCourseRoute = isPrepCourseRoute(pathname)
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null)
  const [courses, setCourses] = useState<PrepCourse[]>([])

  const expanded = manualExpanded ?? onPrepCourseRoute
  const parentActive = onPrepCourseRoute

  const prepCourseApi = useMemo(() => {
    try {
      return createPrepCourseApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!prepCourseApi) return
      try {
        const rows = await prepCourseApi.listCourses()
        if (!alive) return
        setCourses(rows)
      } catch {
        if (!alive) return
        setCourses([])
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [prepCourseApi])

  useEffect(() => {
    if (onPrepCourseRoute) setManualExpanded(null)
  }, [onPrepCourseRoute])

  return (
    <div className="student-sidebar-expandable">
      <button
        type="button"
        className={cn(
          "student-sidebar-link w-full justify-between pr-3",
          parentActive && "student-sidebar-link--active",
        )}
        aria-expanded={expanded}
        onClick={() => setManualExpanded(!expanded)}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <SidebarNavIcon icon={item.icon} />
          <span className="truncate">{item.label}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#666d80] transition-transform duration-150",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="student-sidebar-subnav" role="group" aria-label="Prep courses">
          {courses.map((course) => {
            const href = `${PREP_COURSE_HREF}/${course.slug}`
            const active = isCourseNavActive(pathname, course.slug)
            return (
              <Link
                key={course.id}
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

function StudentAppSidebar({ mobileOpen, onMobileClose }: StudentAppSidebarProps) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const entitlement = useStudentEntitlementOptional()
  const lockLsacNav = entitlement ? !entitlement.canAccessLsacContent : false
  const dashboardActive = isDashboardActive(pathname)

  useEffect(() => {
    onMobileClose()
  }, [onMobileClose, pathname, search])

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
        <div className="student-shell-top-row flex shrink-0 border-b border-[color:var(--greyscale-100)] p-2">
          <Link
            to={STUDENT_DASHBOARD_HREF}
            className="flex h-14 w-full items-center p-3"
            aria-label="betterLSAT home"
          >
            <img src="/betterLSAT_LOGO.png" alt="betterLSAT" className="h-[18px] w-[144px] object-contain" />
          </Link>
        </div>

        <nav className="student-sidebar-nav flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="student-sidebar-menu">
            <p className="student-sidebar-heading">{STUDENT_MAIN_NAV_SECTION.label}</p>
            <Link
              to={STUDENT_DASHBOARD_HREF}
              className={cn("student-sidebar-link", dashboardActive && "student-sidebar-link--active")}
            >
              <SidebarNavIcon icon={STUDENT_DASHBOARD_ICON} />
              <span>Dashboard</span>
            </Link>
            <Link to={STUDENT_DIAGNOSTIC_HREF} className="student-sidebar-link">
              <SidebarNavIcon icon={STUDENT_DIAGNOSTIC_ICON} />
              <span>Diagnostic</span>
            </Link>

            {STUDENT_NAV_SECTIONS.map((section) => (
              <div key={section.key} className="student-sidebar-section">
                <p className="student-sidebar-heading">{section.label}</p>
                {section.items.map((item) => {
                  if (isPrepCourseNavItem(item)) {
                    return <PrepCourseNavItem key={item.href} item={item} pathname={pathname} />
                  }

                  const siblingHrefs = section.items.map((entry) => entry.href)
                  const active = isNavItemActive(pathname, item.href, search, siblingHrefs)

                  if (lockLsacNav && isLsacLockedNavItem(item.href)) {
                    return (
                      <button
                        key={item.href}
                        type="button"
                        disabled
                        aria-disabled="true"
                        title="Link your LawHub coach to unlock"
                        className="student-sidebar-link w-full cursor-not-allowed justify-between pr-4 opacity-60"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <SidebarNavIcon icon={item.icon} />
                          <span className="truncate">{item.label}</span>
                        </span>
                        <Lock className="size-4 shrink-0 text-[#666d80]" aria-hidden />
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn("student-sidebar-link", active && "student-sidebar-link--active")}
                      onClick={(event) => {
                        if (!shouldForceParentNav(pathname, item.href)) return
                        event.preventDefault()
                        navigate(item.href)
                      }}
                    >
                      <SidebarNavIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        </nav>

        <div className="student-sidebar-footer flex shrink-0 px-4 pb-6">
          <div className="student-sidebar-logout-row">
            <button
              type="button"
              className="student-sidebar-logout"
              onClick={() => void handleLogout()}
            >
              <span className="student-sidebar-logout-icon" aria-hidden>
                <img src={STUDENT_NAV_LOGOUT_ICON_SRC} alt="" width={16} height={16} />
              </span>
              <span>Logout</span>
            </button>
            <span className="student-sidebar-version">Version {STUDENT_APP_VERSION}</span>
          </div>
        </div>
      </aside>
    </>
  )
}

export { StudentAppSidebar }
