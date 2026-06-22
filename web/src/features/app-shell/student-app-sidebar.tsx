import { useEffect } from "react"
import { LogOut } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  isDashboardActive,
  isNavItemActive,
  STUDENT_APP_VERSION,
  STUDENT_DASHBOARD_HREF,
  STUDENT_NAV_SECTIONS,
} from "@/features/app-shell/student-nav-config"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type StudentAppSidebarProps = {
  mobileOpen: boolean
  onMobileClose: () => void
}

function StudentAppSidebar({ mobileOpen, onMobileClose }: StudentAppSidebarProps) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
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

        <nav className="student-sidebar-nav flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-2">
          <p className="student-sidebar-heading">Main</p>
          <Link
            to={STUDENT_DASHBOARD_HREF}
            className={cn("student-sidebar-link", dashboardActive && "student-sidebar-link--active")}
          >
            Dashboard
          </Link>

          {STUDENT_NAV_SECTIONS.map((section) => (
            <div key={section.key} className="student-sidebar-section">
              <p className="student-sidebar-heading">{section.label}</p>
              {section.items.map((item) => {
                const siblingHrefs = section.items.map((entry) => entry.href)
                const active = isNavItemActive(pathname, item.href, search, siblingHrefs)
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn("student-sidebar-link", active && "student-sidebar-link--active")}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="student-sidebar-footer flex shrink-0 px-4 pb-6">
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
      </aside>
    </>
  )
}

export { StudentAppSidebar }
