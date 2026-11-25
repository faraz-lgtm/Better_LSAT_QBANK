import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  AdminStudentsFilterDropdown,
  type AdminStudentsFilterOption,
} from "@/features/admin/components/admin-students-filter-dropdown"
import {
  filterStudentRecords,
  formatRelativeDays,
  sortStudentRecords,
  useAdminStudentRecords,
} from "@/features/admin/hooks/use-admin-student-records"
import { useAdminApi } from "@/features/admin/use-admin-api"
import type { AdminStudentRecord } from "@/lib/api/admin"

const SOURCE_DOT: Record<string, string> = {
  "Organic search": "#2563eb",
  Reddit: "#ea580c",
  YouTube: "#dc2626",
  Referral: "#16a34a",
  "Paid ads": "#7c3aed",
  Direct: "#64748b",
}

const ACTIVITY_DOT = {
  high: "#1e40af",
  medium: "#60a5fa",
  low: "#f59e0b",
  dormant: "#94a3b8",
} as const

const PAGE_SIZE_OPTIONS = [25, 50, 100]

function AdminStudentsPage() {
  const adminApi = useAdminApi()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { rows, loading, error, reload } = useAdminStudentRecords()

  const view = params.get("view") ?? "all"
  const search = params.get("q") ?? ""
  const plan = params.get("plan") ?? "all"
  const source = params.get("source") ?? "all"
  const activity = params.get("activity") ?? "all"
  const sort = params.get("sort") ?? "test_date"
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1)
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.get("pageSize")))
    ? Number(params.get("pageSize"))
    : 25
  const selectedStudentId = params.get("student")

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  const counts = useMemo(
    () => ({
      all: rows.length,
      cancelled: rows.filter((r) => r.cancelled_this_month).length,
      upgrade: rows.filter((r) => r.upgrade_candidate).length,
      atRisk: rows.filter((r) => r.at_risk).length,
      neverDiag: rows.filter((r) => r.never_started_diagnostic).length,
      testDate: rows.filter((r) => r.test_date_under_30).length,
      recentSignups: rows.filter((r) => r.recent_signup_24h).length,
    }),
    [rows],
  )

  const filtered = useMemo(() => {
    const base = filterStudentRecords(rows, {
      view: view === "all" ? null : view,
      search,
      plan,
      source,
      activity,
    })
    return sortStudentRecords(base, sort)
  }, [rows, view, search, plan, source, activity, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const selectedStudent = rows.find((r) => r.id === selectedStudentId) ?? null

  const sources = useMemo(() => {
    const preferred = ["Organic search", "Reddit", "YouTube", "Referral", "Paid ads"]
    const set = new Set(rows.map((r) => r.source_label).filter(Boolean))
    const rest = Array.from(set)
      .filter((s) => !preferred.includes(s))
      .sort()
    return [...preferred, ...rest]
  }, [rows])

  const planOptions = useMemo((): AdminStudentsFilterOption[] => {
    const countPlan = (value: string) =>
      filterStudentRecords(rows, { view: view === "all" ? null : view, search, plan: value, source: "all", activity: "all" })
        .length
    const extras = ["1 mo", "12 mo"].filter((p) => rows.some((r) => r.plan_label === p))
    return [
      { value: "all", label: "All plans", count: countPlan("all"), dividerAfter: true },
      {
        value: "6 mo",
        label: "6 months",
        description: "Paid · 6-month access",
        count: countPlan("6 mo"),
      },
      {
        value: "3 mo",
        label: "3 months",
        description: "Paid · 3-month access",
        count: countPlan("3 mo"),
      },
      ...extras.map((p) => ({
        value: p,
        label: p === "1 mo" ? "1 month" : "12 months",
        description: p === "1 mo" ? "Paid · 1-month access" : "Paid · 12-month access",
        count: countPlan(p),
      })),
      {
        value: "free",
        label: "Free",
        description: "No paid plan yet",
        count: countPlan("free"),
      },
    ]
  }, [rows, view, search])

  const sourceOptions = useMemo((): AdminStudentsFilterOption[] => {
    const countSource = (value: string) =>
      filterStudentRecords(rows, {
        view: view === "all" ? null : view,
        search,
        plan: "all",
        source: value,
        activity: "all",
      }).length
    return [
      { value: "all", label: "All sources", count: countSource("all"), dividerAfter: true },
      ...sources.map((s) => ({
        value: s,
        label: s,
        count: countSource(s),
        dotColor: SOURCE_DOT[s] ?? "#64748b",
      })),
    ]
  }, [rows, view, search, sources])

  const activityOptions = useMemo((): AdminStudentsFilterOption[] => {
    const countActivity = (value: string) =>
      filterStudentRecords(rows, {
        view: view === "all" ? null : view,
        search,
        plan: "all",
        source: "all",
        activity: value,
      }).length
    return [
      { value: "all", label: "Any activity", count: countActivity("all"), dividerAfter: true },
      {
        value: "high",
        label: "High",
        description: "5+ study sessions",
        count: countActivity("high"),
        dotColor: ACTIVITY_DOT.high,
      },
      {
        value: "medium",
        label: "Medium",
        description: "2–4 study sessions",
        count: countActivity("medium"),
        dotColor: ACTIVITY_DOT.medium,
      },
      {
        value: "low",
        label: "Low",
        description: "1 study session",
        count: countActivity("low"),
        dotColor: ACTIVITY_DOT.low,
      },
      {
        value: "dormant",
        label: "Dormant",
        description: "No activity in 14+ days",
        count: countActivity("dormant"),
        dotColor: ACTIVITY_DOT.dormant,
      },
    ]
  }, [rows, view, search])

  const sortOptions = useMemo(
    (): AdminStudentsFilterOption[] => [
      {
        value: "test_date",
        label: "Test date, soonest",
        description: "No test date set goes last",
      },
      {
        value: "last_active",
        label: "Last active",
        description: "Most recent first",
      },
      {
        value: "newest",
        label: "Signed up",
        description: "Newest first",
      },
      {
        value: "score_gain",
        label: "Score gain",
        description: "Largest gain first",
      },
    ],
    [],
  )

  function patchParams(next: Record<string, string | null>) {
    const copy = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === "" || v === "all") copy.delete(k)
      else copy.set(k, v)
    }
    setParams(copy, { replace: true })
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(pageRows.map((r) => r.id)))
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function handleDeleteSelected() {
    // Dummy for now — no delete/soft-delete backend wired.
  }

  async function handleUnsubscribeSelected() {
    if (!adminApi || selectedIds.size === 0) return
    const ok = window.confirm(
      `Unsubscribe ${selectedIds.size} student(s)? Active Stripe subscriptions will cancel at period end.`,
    )
    if (!ok) return
    setBulkBusy(true)
    setActionMsg(null)
    try {
      const result = await adminApi.unsubscribeStudents(Array.from(selectedIds))
      setActionMsg(
        result.errors.length > 0
          ? `Unsubscribed ${result.unsubscribed}. Issues: ${result.errors.slice(0, 3).join("; ")}`
          : `Unsubscribed ${result.unsubscribed} subscription(s)${result.skipped ? ` · ${result.skipped} had no active sub` : ""}`,
      )
      await reload()
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Unsubscribe failed")
    } finally {
      setBulkBusy(false)
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)
  const pageNumbers = buildPageNumbers(safePage, totalPages)

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="admin-typo-h1">Students</h1>
          <p className="admin-typo-subtitle">
            Every account, as a worklist. Filter state lives in the URL, so a view can be sent to someone.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary min-h-11 !rounded-[10px] !px-4 !py-2.5 !text-sm !font-semibold"
          onClick={() => navigate("/admin/users")}
        >
          + Add Student
        </button>
      </div>

      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      {actionMsg && <p className="text-sm text-[var(--teal)]">{actionMsg}</p>}
      {loading && <p className="text-sm text-[var(--text3)]">Loading students…</p>}

      <div className="flex flex-wrap items-center gap-3">
        <ViewPill active={view === "all"} onClick={() => patchParams({ view: null, page: "1" })}>
          All · {counts.all}
        </ViewPill>
        <ViewPill
          active={view === "cancelled_this_month"}
          onClick={() => patchParams({ view: "cancelled_this_month", page: "1" })}
        >
          Cancelled this month · {counts.cancelled}
        </ViewPill>
        <ViewPill
          active={view === "upgrade_candidates"}
          onClick={() => patchParams({ view: "upgrade_candidates", page: "1" })}
        >
          Upgrade candidates · {counts.upgrade}
        </ViewPill>
        <ViewPill active={view === "at_risk"} onClick={() => patchParams({ view: "at_risk", page: "1" })}>
          At risk · {counts.atRisk}
        </ViewPill>
        <ViewPill
          active={view === "never_diagnostic"}
          onClick={() => patchParams({ view: "never_diagnostic", page: "1" })}
        >
          Never started a diagnostic · {counts.neverDiag}
        </ViewPill>
        <ViewPill
          active={view === "test_date_under_30"}
          onClick={() => patchParams({ view: "test_date_under_30", page: "1" })}
        >
          Test date under 30 days · {counts.testDate}
        </ViewPill>
        <ViewPill
          active={view === "recent_signups"}
          onClick={() => patchParams({ view: "recent_signups", page: "1" })}
        >
          Recent signups · {counts.recentSignups}
        </ViewPill>
      </div>

      <article className="rounded-[14px] border border-[var(--border)] bg-white">
        <div className="relative z-20 flex flex-wrap items-end gap-3.5 overflow-visible border-b border-[var(--border)] px-[18px] py-4">
          <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-[11px] font-semibold tracking-[0.88px] text-[#5b6475]">
            SEARCH
            <input
              className="h-11 min-h-11 w-full rounded-[10px] border border-[#cbd5e1] bg-white px-3 text-sm text-[var(--text)] outline-none placeholder:text-[#757575] focus:border-[var(--accent)]"
              placeholder="Name or email"
              value={search}
              onChange={(e) => patchParams({ q: e.target.value || null, page: "1" })}
            />
          </label>
          <AdminStudentsFilterDropdown
            fieldLabel="PLAN"
            menuTitle="FILTER BY PLAN"
            value={plan}
            onChange={(next) => patchParams({ plan: next, page: "1" })}
            options={planOptions}
            menuWidth={260}
            className="min-w-[150px]"
          />
          <AdminStudentsFilterDropdown
            fieldLabel="SOURCE"
            menuTitle="HOW THEY FOUND US"
            value={source}
            onChange={(next) => patchParams({ source: next, page: "1" })}
            options={sourceOptions}
            menuWidth={250}
            className="min-w-[170px]"
          />
          <AdminStudentsFilterDropdown
            fieldLabel="ACTIVITY"
            menuTitle="LAST 7 DAYS"
            value={activity}
            onChange={(next) => patchParams({ activity: next, page: "1" })}
            options={activityOptions}
            menuWidth={290}
            className="min-w-[160px]"
          />
          <AdminStudentsFilterDropdown
            fieldLabel="SORT"
            menuTitle="SORT STUDENTS BY"
            value={sort}
            onChange={(next) => patchParams({ sort: next, page: "1" })}
            options={sortOptions}
            menuWidth={290}
            className="min-w-[200px]"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-[#e4e7ec] bg-[var(--accent-bg)] px-5 py-3">
            <span className="text-[13px] font-bold text-[var(--accent)]">{selectedIds.size} selected</span>
            <button
              type="button"
              className="rounded-lg border border-[var(--border2)] bg-white px-3.5 py-2 text-[13px] font-medium text-[var(--text)] disabled:opacity-50"
              disabled={bulkBusy}
              onClick={handleDeleteSelected}
            >
              Delete
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border2)] bg-white px-3.5 py-2 text-[13px] font-medium text-[var(--text)] disabled:opacity-50"
              disabled={bulkBusy}
              onClick={() => void handleUnsubscribeSelected()}
            >
              Unsubscribe
            </button>
          </div>
        )}

        <div className="overflow-x-auto overflow-y-hidden rounded-b-[14px]">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e4e7ec] text-[11px] font-semibold uppercase tracking-[0.66px] text-[var(--text3)]">
                <th className="w-[52px] px-3.5 py-3.5">
                  <input
                    type="checkbox"
                    aria-label="Select all students on this page"
                    checked={pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id))}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="px-3.5 py-3.5">Student</th>
                <th className="px-3.5 py-3.5">Plan</th>
                <th className="px-3.5 py-3.5">Test date</th>
                <th className="px-3.5 py-3.5">Diagnostic → latest</th>
                <th className="px-3.5 py-3.5">
                  <span className="inline-flex items-center gap-1.5">
                    Activity
                    <span
                      className="inline-flex size-3.5 items-center justify-center rounded-[7px] border border-[var(--border2)] text-[9px] font-semibold"
                      title="High: active in last 3 days. Medium: 4–7 days. Dormant: 8+ days."
                    >
                      i
                    </span>
                  </span>
                </th>
                <th className="px-3.5 py-3.5">Last active</th>
                <th className="px-3.5 py-3.5">Source</th>
                <th className="px-3.5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const selected = selectedIds.has(row.id)
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-[#e4e7ec] ${selected ? "bg-[#f8faff]" : "bg-white"}`}
                  >
                    <td className="px-3.5 py-3.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${row.full_name}`}
                        checked={selected}
                        onChange={(e) => toggleOne(row.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-3.5 py-3.5">
                      <div className="text-sm font-bold text-[var(--text)]">{row.full_name}</div>
                      <div className="pt-0.5 text-xs text-[var(--text3)]">{row.email}</div>
                    </td>
                    <td className="px-3.5 py-3.5">
                      <PlanBadge label={row.plan_label} />
                    </td>
                    <td className="px-3.5 py-3.5 text-[var(--text)]">
                      <TestDateCell row={row} />
                    </td>
                    <td className="px-3.5 py-3.5">
                      <ScoreCell row={row} />
                    </td>
                    <td className="px-3.5 py-3.5">
                      <ActivityBadge row={row} />
                    </td>
                    <td className="px-3.5 py-3.5">
                      <LastActiveCell days={row.days_inactive} />
                    </td>
                    <td className="px-3.5 py-3.5 text-[var(--text3)]">{row.source_label || "—"}</td>
                    <td className="px-3.5 py-3.5">
                      <button
                        type="button"
                        className="rounded-lg border border-[var(--border2)] bg-white px-3 py-1.5 text-[13px] font-medium text-[var(--text)]"
                        onClick={() => patchParams({ student: row.id })}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                )
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3.5 py-10 text-center text-[var(--text3)]">
                    No students match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e4e7ec] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-[13px] font-normal text-[#5a6478]">Rows per page</span>
            <PageSizeSelect
              value={pageSize}
              options={PAGE_SIZE_OPTIONS}
              onChange={(next) => patchParams({ pageSize: String(next), page: "1" })}
            />
            <span className="whitespace-nowrap text-[13px] font-normal text-[#5a6478]">
              {rangeStart}–{rangeEnd} of {filtered.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PagerButton disabled={safePage <= 1} onClick={() => patchParams({ page: String(safePage - 1) })}>
              Previous
            </PagerButton>
            {pageNumbers.map((item, idx) =>
              item === "…" ? (
                <span key={`ellipsis-${idx}`} className="text-[13px] font-normal text-[#5a6478]">
                  …
                </span>
              ) : (
                <PagerButton
                  key={item}
                  active={item === safePage}
                  onClick={() => patchParams({ page: String(item) })}
                >
                  {item}
                </PagerButton>
              ),
            )}
            <PagerButton
              disabled={safePage >= totalPages}
              onClick={() => patchParams({ page: String(safePage + 1) })}
            >
              Next
            </PagerButton>
          </div>
        </div>
      </article>

      {selectedStudent && (
        <StudentDetailDrawer row={selectedStudent} onClose={() => patchParams({ student: null })} />
      )}
    </section>
  )
}

function StudentDetailDrawer({ row, onClose }: { row: AdminStudentRecord; onClose: () => void }) {
  const adminApi = useAdminApi()
  const [notes, setNotes] = useState<Array<{ id: string; body: string; created_at: string }>>([])
  const [noteText, setNoteText] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      if (!adminApi) return
      try {
        const n = await adminApi.listStudentNotes(row.id)
        if (!alive) return
        setNotes(n as Array<{ id: string; body: string; created_at: string }>)
      } catch {
        if (!alive) return
        setNotes([])
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [adminApi, row.id])

  const chartData = useMemo(() => {
    const points: Array<{ label: string; score: number }> = []
    if (row.diagnostic_score != null) points.push({ label: "diagnostic", score: row.diagnostic_score })
    if (row.latest_score != null) points.push({ label: "latest", score: row.latest_score })
    return points
  }, [row])

  async function addNote() {
    if (!adminApi || !noteText.trim()) return
    setBusy(true)
    try {
      await adminApi.addStudentNote(row.id, noteText.trim())
      setNoteText("")
      const n = await adminApi.listStudentNotes(row.id)
      setNotes(n as typeof notes)
      setMsg("Note saved")
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to save note")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text)]">{row.full_name}</h2>
            <p className="text-sm text-[var(--text3)]">
              {row.email} · joined {fmtDate(row.created_at)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                {row.plan_label}
              </span>
              {row.current_period_end && (
                <span className="rounded-full bg-[var(--surface3)] px-2 py-0.5 text-xs text-[var(--text2)]">
                  renews {fmtDate(row.current_period_end)}
                </span>
              )}
            </div>
          </div>
          <button type="button" className="text-xl text-[var(--text3)]" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-5 py-3">
          <button type="button" className="admin-btn admin-btn-ghost !px-3 !py-1.5 !text-sm" disabled title="Coming soon">
            Send email
          </button>
          <button type="button" className="admin-btn admin-btn-ghost !px-3 !py-1.5 !text-sm" disabled title="Coming soon">
            View as student
          </button>
          <button type="button" className="admin-btn admin-btn-primary !px-3 !py-1.5 !text-sm" disabled={busy} onClick={() => void addNote()}>
            Add note
          </button>
        </div>

        {msg && <p className="px-5 pt-3 text-sm text-[var(--teal)]">{msg}</p>}

        <div className="grid grid-cols-2 gap-3 px-5 py-4">
          <Stat label="Test date" value={row.planned_lsat_date ? `${fmtDate(row.planned_lsat_date)} · ${row.days_to_test ?? "—"} days` : "—"} />
          <Stat
            label="Goal score"
            value={
              row.goal_score != null
                ? `${row.goal_score}${row.latest_score != null ? ` · gap of ${Math.max(0, row.goal_score - row.latest_score)}` : ""}`
                : "—"
            }
          />
          <Stat label="PrepTests done" value={String(row.preptest_done ?? 0)} />
          <Stat label="Lifetime value" value={row.is_paid ? estimateLtv(row) : "$0"} />
        </div>

        <div className="px-5 pb-4">
          <h3 className="mb-2 text-sm font-semibold">Score trajectory</h3>
          <div className="h-40 rounded-xl border border-[var(--border)] p-2">
            {chartData.length >= 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[120, 180]} tick={{ fontSize: 11 }} width={36} />
                  <Tooltip />
                  {row.goal_score != null && <ReferenceLine y={row.goal_score} stroke="#94a3b8" strokeDasharray="4 4" />}
                  <Line type="monotone" dataKey="score" stroke="#0d47a1" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-[var(--text3)]">No scores yet</p>
            )}
          </div>
        </div>

        <div className="px-5 pb-4">
          <h3 className="mb-2 text-sm font-semibold">Journey</h3>
          <ol className="space-y-2 text-sm text-[var(--text2)]">
            <li>1. Signed up · {fmtDate(row.created_at)}</li>
            <li>2. {row.has_diagnostic ? `Took diagnostic · ${row.diagnostic_score ?? "—"}` : "Diagnostic not started"}</li>
            <li>3. {row.preptest_done > 0 ? `PrepTests done · ${row.preptest_done}` : "No PrepTest yet"}</li>
            <li>4. {row.is_paid ? `Upgraded · ${row.plan_label}` : "Still free"}</li>
            <li>5. Latest activity · {formatRelativeDays(row.days_inactive)}</li>
          </ol>
        </div>

        <div className="px-5 pb-4">
          <h3 className="mb-2 text-sm font-semibold">Add note</h3>
          <textarea
            className="min-h-20 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Internal note…"
          />
        </div>

        <div className="px-5 pb-6">
          <h3 className="mb-2 text-sm font-semibold">Notes</h3>
          <ul className="space-y-2 text-sm text-[var(--text2)]">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-[var(--surface2)] px-3 py-2">
                {fmtDate(n.created_at)} · {n.body}
              </li>
            ))}
            {notes.length === 0 && <li className="text-[var(--text3)]">No notes yet.</li>}
          </ul>
        </div>
      </aside>
    </div>
  )
}

function ViewPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--border2)] bg-white text-[var(--text2)]"
      }`}
    >
      {children}
    </button>
  )
}

function PlanBadge({ label }: { label: string }) {
  const free = label.toLowerCase() === "free"
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
        free ? "bg-[#f1f3f7] text-[var(--text2)]" : "bg-[var(--accent-bg)] text-[var(--accent)]"
      }`}
    >
      {label}
    </span>
  )
}

function TestDateCell({ row }: { row: AdminStudentRecord }) {
  if (!row.planned_lsat_date) {
    return <span className="text-[var(--text3)]">Not set</span>
  }
  return (
    <span>
      {fmtDate(row.planned_lsat_date)}
      {row.days_to_test != null ? (
        <>
          {" · "}
          <span className="font-bold">{row.days_to_test} days</span>
        </>
      ) : null}
    </span>
  )
}

function ScoreCell({ row }: { row: AdminStudentRecord }) {
  if (row.diagnostic_score == null && row.latest_score == null) {
    return <span className="text-[var(--text3)]">No diagnostic</span>
  }
  const delta = row.score_delta
  return (
    <span className="text-[var(--text)]">
      {row.diagnostic_score ?? "—"}
      {row.latest_score != null ? ` → ${row.latest_score}` : ""}
      {delta != null ? (
        <span className={`font-bold ${delta >= 0 ? " text-[var(--teal)]" : " text-[var(--red)]"}`}>
          {" "}
          {delta >= 0 ? "+" : ""}
          {delta}
        </span>
      ) : null}
    </span>
  )
}

function ActivityBadge({ row }: { row: AdminStudentRecord }) {
  if (row.activity_band === "dormant" && row.is_paid) {
    return (
      <span className="inline-flex rounded-md bg-[var(--red-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--red)]">
        Dormant · paid
      </span>
    )
  }
  if (row.activity_band === "dormant") {
    return (
      <span className="inline-flex rounded-md bg-[#f1f3f7] px-2 py-0.5 text-xs font-semibold text-[var(--text2)]">
        Dormant · free
      </span>
    )
  }
  const label = row.activity_band === "medium" ? "Medium" : "High"
  return (
    <span className="inline-flex rounded-md bg-[var(--accent-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
      {label}
    </span>
  )
}

function LastActiveCell({ days }: { days: number | null | undefined }) {
  const label = formatRelativeDays(days)
  const stale = days != null && days >= 8
  return <span className={stale ? "text-[var(--red)]" : "text-[var(--text)]"}>{label}</span>
}

/** Figma `21921:29171` — compact rows-per-page control */
function PageSizeSelect({
  value,
  options,
  onChange,
}: {
  value: number
  options: number[]
  onChange: (value: number) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (rootRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Rows per page"
        className="relative box-border flex h-[33px] w-[66px] items-center overflow-hidden rounded-lg border border-[#c9d0dc] bg-white text-left"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="pl-3.5 text-sm font-normal leading-none text-[#1a1b25]">{value}</span>
        <span className="absolute inset-y-0 right-0 flex w-[27px] items-center justify-center" aria-hidden>
          <img
            src="/figma/admin/pager-chevron.svg"
            alt=""
            width={10}
            height={6}
            className="h-[6px] w-[10px] max-w-none"
            draggable={false}
          />
        </span>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute bottom-[calc(100%+4px)] left-0 z-[130] min-w-full overflow-hidden rounded-lg border border-[#c9d0dc] bg-white py-1 shadow-[0px_8px_16px_rgba(15,23,42,0.12)]"
        >
          {options.map((n) => {
            const selected = n === value
            return (
              <li key={n} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex w-full px-3.5 py-1.5 text-left text-sm ${
                    selected ? "bg-[#eef3ff] font-medium text-[#0d47a1]" : "font-normal text-[#1a1b25] hover:bg-[#f8fafc]"
                  }`}
                  onClick={() => {
                    onChange(n)
                    setOpen(false)
                  }}
                >
                  {n}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function PagerButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-[11px] py-[7px] text-[13px] font-medium leading-none disabled:opacity-40 ${
        active
          ? "border-[#0d47a1] bg-[#0d47a1] text-white"
          : "border-[#c9d0dc] bg-white text-[#1a1b25]"
      }`}
    >
      {children}
    </button>
  )
}

function buildPageNumbers(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  if (current <= 3) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }
  if (current >= total - 2) {
    pages.add(total - 1)
    pages.add(total - 2)
    pages.add(total - 3)
  }
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: Array<number | "…"> = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push("…")
    out.push(sorted[i]!)
  }
  return out
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-3">
      <p className="text-xs text-[var(--text3)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text)]">{value}</p>
    </div>
  )
}

function estimateLtv(row: AdminStudentRecord) {
  const monthly =
    row.plan_label === "1 mo" ? 69 : row.plan_label === "3 mo" ? 192 : row.plan_label === "6 mo" ? 354 : row.plan_label === "12 mo" ? 624 : 0
  return `$${monthly}`
}

function fmtDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

export { AdminStudentsPage }
