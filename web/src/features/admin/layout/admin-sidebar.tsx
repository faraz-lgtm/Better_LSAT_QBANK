import { useEffect, useMemo, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"

import { useAdminApi } from "@/features/admin/use-admin-api"
import { resetUser } from "@/lib/analytics/posthog"
import { clearStudentSessionCaches } from "@/lib/auth/clear-student-session-caches"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const links: Array<{ to: string; label: string; section: "Content" | "Settings"; badge?: string }> = [
  { to: "/admin/dashboard", label: "Dashboard", section: "Content" },
  { to: "/admin/insights", label: "Insights", section: "Content" },
  { to: "/admin/students", label: "Students", section: "Content" },
  { to: "/admin/preptests", label: "PrepTests", section: "Content" },
  { to: "/admin/preptests", label: "Question editor", section: "Content" },
  { to: "/admin/courses", label: "Courses", section: "Content" },
  { to: "/admin/taxonomy", label: "Taxonomy", section: "Settings" },
  { to: "/admin/config", label: "Config", section: "Settings" },
  { to: "/admin/users", label: "Users", section: "Settings" },
]

function AdminSidebar() {
  const navigate = useNavigate()
  const adminApi = useAdminApi()
  const [prepTestsCount, setPrepTestsCount] = useState<number | null>(null)
  const [coursesCount, setCoursesCount] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    let inFlight = false
    async function loadCounts() {
      if (!adminApi || inFlight) return
      inFlight = true
      try {
        const [prepTestsCount, coursesCount] = await Promise.all([
          adminApi.countPrepTests(),
          adminApi.countCourses(),
        ])
        if (!alive) return
        setPrepTestsCount(prepTestsCount)
        setCoursesCount(coursesCount)
      } catch {
        if (!alive) return
        setPrepTestsCount(null)
        setCoursesCount(null)
      } finally {
        inFlight = false
      }
    }
    void loadCounts()
    return () => {
      alive = false
    }
  }, [adminApi])

  const linksWithBadges = useMemo(
    () =>
      links.map((link) => {
        if (link.label === "PrepTests" && prepTestsCount !== null) {
          return { ...link, badge: String(prepTestsCount) }
        }
        if (link.label === "Courses" && coursesCount !== null) {
          return { ...link, badge: String(coursesCount) }
        }
        return link
      }),
    [coursesCount, prepTestsCount],
  )

  async function handleLogout() {
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      clearStudentSessionCaches()
      resetUser()
    } finally {
      navigate("/login", { replace: true })
    }
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[#dfe1e7] bg-white">
      <div className="flex h-14 shrink-0 items-center border-b border-[#dfe1e7] px-6">
        <img src="/betterLSAT_LOGO.png" alt="betterLSAT" className="h-[18px] w-auto" />
      </div>
      <nav className="flex-1 space-y-6 overflow-auto px-3 pt-4">
        {(["Content", "Settings"] as const).map((section) => (
          <div key={section} className="space-y-2.5">
            <p className="px-1 text-xs uppercase tracking-[0.6px] text-[#666d80]">{section}</p>
            <div className="space-y-1">
              {linksWithBadges.filter((link) => link.section === section).map((link) => (
                <NavLink
                  key={`${link.to}-${link.label}`}
                  to={link.to}
                  end={link.to === "/admin/dashboard"}
                  className={({ isActive }) =>
                    `flex h-9 items-center rounded-[10px] px-3 text-sm font-medium leading-5 ${
                      isActive
                        ? "bg-[#f3f7ff] text-[var(--accent)]"
                        : "text-[var(--text)] hover:bg-[#f3f7ff]/hover:text-[var(--accent)]"
                    }`
                  }
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-auto rounded-full bg-[var(--surface3)] px-1.5 py-0.5 text-[10px] text-[var(--text3)]">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-[#dfe1e7] p-3">
        <button type="button" className="admin-btn admin-btn-ghost w-full justify-center" onClick={() => void handleLogout()}>
          Log out
        </button>
      </div>
    </aside>
  )
}

export { AdminSidebar }
