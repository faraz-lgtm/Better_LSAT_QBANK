import { useMemo } from "react"
import { useLocation } from "react-router-dom"

function AdminTopbar() {
  const location = useLocation()
  const title = useMemo(() => {
    if (location.pathname.startsWith("/admin/courses")) return "Create New Course"
    if (location.pathname.startsWith("/admin/preptests")) return "PrepTests"
    if (location.pathname.startsWith("/admin/taxonomy")) return "Taxonomy"
    if (location.pathname.startsWith("/admin/you-try")) return "You Try"
    if (location.pathname.startsWith("/admin/users")) return "Users"
    if (location.pathname.startsWith("/admin/config")) return "Config"
    return "Dashboard"
  }, [location.pathname])

  const showCourseActions = location.pathname.startsWith("/admin/courses")

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] !text-black">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        {showCourseActions ? (
          <>
            <span className="text-xs text-[var(--text3)]">Saved just now</span>
            <button type="button" className="admin-btn admin-btn-ghost !px-3 !py-1.5 !text-xs">Save Draft</button>
            <button type="button" className="admin-btn admin-btn-ghost !px-3 !py-1.5 !text-xs">Preview</button>
            <button type="button" className="admin-btn admin-btn-primary !px-3 !py-1.5 !text-xs">Publish</button>
          </>
        ) : (
          <>
            <div className="hidden w-[220px] items-center rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] px-3 py-1.5 text-sm text-[var(--text3)] md:flex">
              Search anything...
            </div>
            <button type="button" className="admin-btn admin-btn-primary !text-sm !px-4 !py-2">+ Create Course</button>
          </>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">JD</div>
      </div>
    </header>
  )
}

export { AdminTopbar }
