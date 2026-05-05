import { useEffect, useMemo, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"

import { useAdminApi } from "@/features/admin/use-admin-api"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const links: Array<{ to: string; label: string; section: "Content" | "Settings"; badge?: string }> = [
  { to: "/admin/dashboard", label: "Dashboard", section: "Content" },
  { to: "/admin/preptests", label: "PrepTests", section: "Content" },
  { to: "/admin/courses", label: "Courses", section: "Content" },
  { to: "/admin/taxonomy", label: "Taxonomy", section: "Settings" },
  { to: "/admin/config", label: "Config", section: "Settings" },
  { to: "/admin/users", label: "Users", section: "Settings" },
  { to: "/admin/you-try", label: "You Try", section: "Settings" },
]

function AdminSidebar() {
  const navigate = useNavigate()
  const adminApi = useAdminApi()
  const [prepTestsCount, setPrepTestsCount] = useState<number | null>(null)
  const [coursesCount, setCoursesCount] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    async function loadCounts() {
      if (!adminApi) return
      try {
        const [prepTests, courses] = await Promise.all([
          adminApi.listPrepTests(1, 0),
          adminApi.listCourses(),
        ])
        if (!alive) return
        setPrepTestsCount(Number(prepTests.total ?? 0))
        setCoursesCount(Array.isArray(courses) ? courses.length : 0)
      } catch {
        if (!alive) return
        setPrepTestsCount(null)
        setCoursesCount(null)
      }
    }
    void loadCounts()
    const intervalId = window.setInterval(() => {
      void loadCounts()
    }, 15000)
    return () => {
      alive = false
      window.clearInterval(intervalId)
    }
  }, [adminApi])

  const linksWithBadges = useMemo(
    () =>
      links.map((link) => {
        if (link.to === "/admin/preptests" && prepTestsCount !== null) {
          return { ...link, badge: String(prepTestsCount) }
        }
        if (link.to === "/admin/courses" && coursesCount !== null) {
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
    } finally {
      navigate("/login", { replace: true })
    }
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--surface2)]">
      <div className="mb-4 border-b border-[var(--border)] px-4 py-4">
        <div className="flex items-center gap-2">
          <img src="/betterLSAT_LOGO.png" alt="betterLSAT" className="h-8 w-auto" />
        </div>
      </div>
      <nav className="space-y-5 flex-1 px-3">
        {(["Content", "Settings"] as const).map((section) => (
          <div key={section}>
            <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.08em] text-[var(--text3)]">{section}</p>
            <div className="space-y-1">
              {linksWithBadges.filter((link) => link.section === section).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center rounded-[10px] border px-3 py-2 text-[14px] font-medium leading-5 ${
                      isActive
                        ? "border-transparent bg-[var(--accent-bg)] font-medium text-black"
                        : "border-transparent text-[var(--text2)] hover:bg-[#f3f4f6] hover:text-black"
                    }`
                  }
                >
                  <span>{link.label}</span>
                  {link.badge && <span className="ml-auto rounded-full bg-[var(--surface3)] px-1.5 py-0.5 text-[10px] text-[var(--text3)]">{link.badge}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-3 border-t border-[var(--border)] p-3">
        <button type="button" className="admin-btn admin-btn-ghost w-full justify-center" onClick={() => void handleLogout()}>
          Log out
        </button>
      </div>
    </aside>
  )
}

export { AdminSidebar }
