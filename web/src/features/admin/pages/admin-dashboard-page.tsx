import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { createAdminApi } from "@/lib/api/admin"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function pct(v: number) {
  return `${Math.max(0, Math.min(100, Math.round(v)))}%`
}

function AdminDashboardPage() {
  const navigate = useNavigate()
  const adminApiState = useMemo(() => {
    try {
      return { api: createAdminApi(getSupabaseBrowserClient()), error: null as string | null }
    } catch (e) {
      return { api: null, error: e instanceof Error ? e.message : "Failed to initialize admin API" }
    }
  }, [])
  const adminApi = adminApiState.api
  const adminApiError = adminApiState.error
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([])
  const [courses, setCourses] = useState<Array<Record<string, unknown>>>([])
  const [usersCount, setUsersCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const totalPrepTests = rows.length
  const totals = rows.reduce<{ total: number; explained: number; tagged: number }>(
    (acc, row) => {
      const stats = (row.stats ?? {}) as Record<string, number>
      acc.total += stats.total ?? 0
      acc.explained += stats.explained ?? 0
      acc.tagged += stats.tagged ?? 0
      return acc
    },
    { total: 0, explained: 0, tagged: 0 },
  )
  const explainedPct = totals.total > 0 ? (100 * totals.explained) / totals.total : 0

  useEffect(() => {
    let alive = true
    async function load() {
      if (!adminApi) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const [data, courseRows, userRows] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.listCourses(),
          adminApi.listUsers(500),
        ])
        if (alive) {
          setRows(data as Array<Record<string, unknown>>)
          setCourses((courseRows as Array<Record<string, unknown>>) ?? [])
          setUsersCount(Array.isArray(userRows) ? userRows.length : 0)
          setIsLoading(false)
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : "Failed to load dashboard")
          setIsLoading(false)
        }
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [adminApi])

  return (
    <section className="space-y-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="admin-typo-h1">Good morning, Admin</h1>
          <p className="admin-typo-subtitle mt-1">Here's what's happening with your academy today.</p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary !px-4 !py-2 !text-sm" onClick={() => navigate("/admin/courses")}>
          + Create Course
        </button>
      </div>
      {adminApiError && (
        <p className="rounded-lg border border-[#3a1a1e] bg-[#1a0a0e] px-3 py-2 text-sm text-[var(--red)]">
          {adminApiError}. Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `web/.env.local`.
        </p>
      )}
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      {isLoading && <p className="text-sm text-[var(--text3)]">Loading dashboard...</p>}
      {!isLoading && !error && !adminApiError && rows.length === 0 && (
        <p className="text-sm text-[var(--text3)]">No prep test rows found for the dashboard yet.</p>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <article className="admin-surface p-4">
          <p className="admin-muted mb-2 text-sm">Total Students</p>
          <p className="text-[40px] font-semibold leading-none text-[var(--text)]">{usersCount.toLocaleString()}</p>
          <p className="mt-2 text-sm text-[var(--teal)]">+12% from last month</p>
        </article>
        <article className="admin-surface p-4">
          <p className="admin-muted mb-2 text-sm">Active Courses</p>
          <p className="text-[40px] font-semibold leading-none text-[var(--text)]">{courses.length}</p>
          <p className="mt-2 text-sm text-[var(--teal)]">+2 from last month</p>
        </article>
        <article className="admin-surface p-4">
          <p className="admin-muted mb-2 text-sm">Avg. Completion</p>
          <p className="text-[40px] font-semibold leading-none text-[var(--text)]">{pct(explainedPct)}</p>
          <p className="mt-2 text-sm text-[var(--teal)]">+4% from last month</p>
        </article>
        <article className="admin-surface p-4">
          <p className="admin-muted mb-2 text-sm">Total Hours</p>
          <p className="text-[40px] font-semibold leading-none text-[var(--text)]">
            {Math.max(0, Math.round((totals.total / Math.max(1, totalPrepTests || 1)) * 10)).toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-[var(--teal)]">+8% from last month</p>
        </article>
      </div>
      <div className="admin-surface overflow-hidden">
        <div className="flex items-center border-b border-[var(--border)] px-4 py-3">
          <p className="text-xl font-semibold text-[var(--text)]">Recent Courses</p>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left text-sm text-[var(--text3)]">Course Name</th>
              <th className="px-4 py-3 text-left text-sm text-[var(--text3)]">Status</th>
              <th className="px-4 py-3 text-left text-sm text-[var(--text3)]">Enrolled</th>
              <th className="px-4 py-3 text-left text-sm text-[var(--text3)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.slice(0, 12).map((row) => {
              return (
                <tr key={String(row.id)} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface2)]">
                  <td className="px-4 py-3 text-sm text-[var(--text)]">{String(row.title ?? "Untitled Course")}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text2)]">
                    {Boolean(row.is_published) ? (
                      <span className="admin-pill admin-pill-complete">Published</span>
                    ) : (
                      <span className="admin-pill admin-pill-draft">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text2)]">120</td>
                  <td className="px-4 py-3 text-sm text-[var(--accent)]">
                    <button type="button" onClick={() => navigate("/admin/courses")}>
                      Edit Curriculum
                    </button>
                  </td>
                </tr>
              )
            })}
            {courses.length === 0 && !isLoading && (
              <tr>
                <td className="px-4 py-4 text-[12px] text-[var(--text3)]" colSpan={4}>
                  No courses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export { AdminDashboardPage }
