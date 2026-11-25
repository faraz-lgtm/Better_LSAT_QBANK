import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

import {
  AdminCustomDateRangeDialog,
  addDays,
  daysInclusive,
  startOfDay,
  type DateRangeValue,
} from "@/features/admin/components/admin-custom-date-range-dialog"
import {
  createdAtInRange,
  formatRelativeDays,
  monthlyEquivalentUsd,
  useAdminStudentRecords,
} from "@/features/admin/hooks/use-admin-student-records"
import { useAdminApi } from "@/features/admin/use-admin-api"
import type { AdminStudentRecord } from "@/lib/api/admin"

type RangeKey = "7" | "30" | "90" | "custom"

/** Preview rows on each dashboard worklist; full lists open via View All. */
const DASHBOARD_PREVIEW_LIMIT = 3

function sparkData(seed: number) {
  return Array.from({ length: 12 }, (_, i) => ({
    i,
    v: Math.max(2, Math.round(seed + Math.sin(i / 2) * 4 + i * 0.6)),
  }))
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function AdminDashboardPage() {
  const navigate = useNavigate()
  const adminApi = useAdminApi()
  const { rows, loading, error } = useAdminStudentRecords()
  const [range, setRange] = useState<RangeKey>("30")
  const [courses, setCourses] = useState<Array<Record<string, unknown>>>([])
  const [customOpen, setCustomOpen] = useState(false)
  const [customRange, setCustomRange] = useState<DateRangeValue>(() => {
    const end = startOfDay(new Date())
    return { start: addDays(end, -29), end }
  })

  useEffect(() => {
    let alive = true
    async function loadCourses() {
      if (!adminApi) return
      try {
        const c = await adminApi.listCourses()
        if (alive) setCourses((c as Array<Record<string, unknown>>) ?? [])
      } catch {
        if (alive) setCourses([])
      }
    }
    void loadCourses()
    return () => {
      alive = false
    }
  }, [adminApi])

  const launchDate = useMemo(() => {
    const times = courses
      .map((c) => (typeof c.created_at === "string" ? Date.parse(c.created_at) : NaN))
      .filter((t) => Number.isFinite(t))
    if (times.length === 0) return null
    return new Date(Math.min(...times))
  }, [courses])

  const activeRange = useMemo(() => {
    if (range === "custom") return customRange
    const end = startOfDay(new Date())
    const days = Number(range)
    return { start: addDays(end, -(days - 1)), end }
  }, [range, customRange])

  const rangeDays = daysInclusive(activeRange.start, activeRange.end)
  const sinceMs = startOfDay(activeRange.start).getTime()
  const untilMs = startOfDay(activeRange.end).getTime() + 86400000 - 1
  const prevUntilMs = sinceMs - 1
  const prevSinceMs = prevUntilMs - (untilMs - sinceMs)

  const stats = useMemo(() => {
    const paid = rows.filter((r) => r.is_paid)
    const newPaidInRange = paid.filter((r) => {
      const t = Date.parse(r.created_at)
      return t >= sinceMs && t <= untilMs
    })
    const newPaidPrev = paid.filter((r) => {
      const t = Date.parse(r.created_at)
      return t >= prevSinceMs && t <= prevUntilMs
    })
    const mrr = paid.reduce((sum, r) => sum + monthlyEquivalentUsd(r.plan_label), 0)
    const mrrFromNew = newPaidInRange.reduce((sum, r) => sum + monthlyEquivalentUsd(r.plan_label), 0)
    const mrrFromPrevNew = newPaidPrev.reduce((sum, r) => sum + monthlyEquivalentUsd(r.plan_label), 0)
    const active7 = rows.filter((r) => r.last_active_at && Date.parse(r.last_active_at) >= Date.now() - 7 * 86400000)
    const activePrev7 = rows.filter((r) => {
      if (!r.last_active_at) return false
      const t = Date.parse(r.last_active_at)
      return t >= Date.now() - 14 * 86400000 && t < Date.now() - 7 * 86400000
    })
    const paidActive = active7.filter((r) => r.is_paid).length
    const freeActive = active7.filter((r) => !r.is_paid).length
    const paidTotal = paid.length || 1
    const freeTotal = rows.filter((r) => !r.is_paid).length || 1
    const activityRate = rows.length === 0 ? 0 : Math.round((100 * active7.length) / rows.length)
    const prevActivityRate = rows.length === 0 ? 0 : Math.round((100 * activePrev7.length) / rows.length)
    const inRange = (r: AdminStudentRecord) => createdAtInRange(r, sinceMs, untilMs)
    return {
      mrr,
      mrrDelta: mrrFromNew - mrrFromPrevNew,
      newPaid: newPaidInRange.length,
      newPaidDelta: newPaidInRange.length - newPaidPrev.length,
      paidCount: paid.length,
      total: rows.length,
      activityRate,
      activityDeltaPts: activityRate - prevActivityRate,
      paidActivityPct: Math.round((100 * paidActive) / paidTotal),
      freeActivityPct: Math.round((100 * freeActive) / freeTotal),
      paidActive7: paidActive,
      // Worklists + matching chips follow the selected signup window.
      atRisk: rows.filter((r) => r.at_risk && inRange(r)),
      upgrade: rows.filter((r) => r.upgrade_candidate && inRange(r)),
      recent: rows.filter((r) => inRange(r)),
      failedPayments: 0,
      testDateLow: rows.filter((r) => r.test_date_under_30 && (r.days_inactive ?? 99) >= 7),
      neverDiag: rows.filter((r) => r.never_started_diagnostic),
      rangeDays,
    }
  }, [rows, sinceMs, untilMs, prevSinceMs, prevUntilMs, rangeDays])

  const customLabel =
    range === "custom"
      ? `${activeRange.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${activeRange.end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : "Custom"

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="admin-typo-h1">
            {greeting()}, Admin
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm leading-5 text-[#5b6475]">
            <span>Growth, conversion and how people use the platform.</span>
         
          </p>
        </div>
        <div className="flex items-center rounded-[10px] border border-[#e3e8ef] bg-white p-[3px]">
          {(["7", "30", "90"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`min-h-9 rounded-[7px] px-3 py-2 text-sm ${
                range === key
                  ? "bg-[#1e40af] font-semibold text-white"
                  : "font-normal text-[#475569] hover:bg-[var(--surface3)]"
              }`}
              onClick={() => setRange(key)}
            >
              {key} days
            </button>
          ))}
          <button
            type="button"
            className={`min-h-9 rounded-[7px] px-3 py-2 text-sm ${
              range === "custom"
                ? "bg-[#1e40af] font-semibold text-white"
                : "font-normal text-[#475569] hover:bg-[var(--surface3)]"
            }`}
            onClick={() => setCustomOpen(true)}
          >
            {customLabel}
          </button>
        </div>
      </div>

      <AdminCustomDateRangeDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        initialRange={activeRange}
        launchDate={launchDate}
        onApply={(next) => {
          setCustomRange(next)
          setRange("custom")
        }}
      />

      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      {loading && <p className="text-sm text-[var(--text3)]">Loading student records…</p>}

      <div className="grid gap-5 md:grid-cols-3">
        <KpiCard
          label="Monthly recurring revenue"
          info="Sum of monthly-equivalent plan value for currently paid students."
          value={`$${stats.mrr.toLocaleString()}`}
          delta={formatSignedMoney(stats.mrrDelta)}
          hint={`vs previous ${stats.rangeDays} days`}
          spark={sparkData(20)}
        />
        <KpiCard
          label="New paid students"
          info="Paid accounts whose signup falls in the selected date range."
          value={String(stats.newPaid)}
          delta={formatSigned(stats.newPaidDelta)}
          hint={`${stats.paidCount} paid of ${stats.total} students`}
          spark={sparkData(8)}
        />
        <KpiCard
          label="Activity rate · fixed 7-day window"
          info="Share of all students active in the last 7 days, independent of the date range control."
          value={`${stats.activityRate}%`}
          delta={`${formatSigned(stats.activityDeltaPts)} pts`}
          hint={`paid ${stats.paidActivityPct}% · free ${stats.freeActivityPct}%`}
          spark={sparkData(14)}
        />
      </div>

      <div className="flex flex-wrap gap-3 rounded-[14px] border border-[#e4e7ec] bg-white px-[23px] py-[18px]">
        <AlertChip to="/admin/students?view=cancelled_this_month" tone="red" count={stats.failedPayments} label="Failed payments" />
        <AlertChip
          to="/admin/students?view=test_date_under_30"
          tone="muted"
          count={stats.testDateLow.length}
          label="Test date under 30 days, low activity"
        />
        <AlertChip to="/admin/students?view=at_risk" tone="amber" count={stats.atRisk.length} label="Paid students at risk" />
        <AlertChip to="/admin/students?view=upgrade_candidates" tone="teal" count={stats.upgrade.length} label="Upgrade candidates" />
        <AlertChip
          to="/admin/students?view=never_diagnostic"
          tone="muted"
          count={stats.neverDiag.length}
          label="Never started a diagnostic"
        />
      </div>

      <div className="flex flex-col gap-5">
        <p className="pt-3 text-xs font-semibold tracking-[0.96px] text-[#5b6475]">STUDY ACTIVITY</p>

        <WorklistCard
          title="Paid students at risk"
          count={stats.atRisk.length}
          subtitle="Inactive 7+ days, usage falling fast, or stuck on a module."
          viewAllTo="/admin/students?view=at_risk"
        >
          <StudentTable>
            <thead>
              <tr className="border-b border-[#e4e7ec] text-[11px] font-semibold uppercase tracking-[0.66px] text-[var(--text3)]">
                <th className="px-4 py-3.5 text-left">Student</th>
                <th className="px-4 py-3.5 text-left">Plan</th>
                <th className="px-4 py-3.5 text-left">Why</th>
                <th className="px-4 py-3.5 text-left">Test date</th>
                <th className="px-4 py-3.5 text-left">Last active</th>
                <th className="px-4 py-3.5 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.atRisk.slice(0, DASHBOARD_PREVIEW_LIMIT).map((row) => (
                <tr key={row.id} className="border-b border-[#e4e7ec]">
                  <td className="px-4 py-3.5">
                    <StudentCell row={row} />
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text)]">
                    {row.plan_label}
                    {row.days_left != null ? ` · ${row.days_left} days left` : ""}
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text)]">{row.risk_why ?? "—"}</td>
                  <td className="px-4 py-3.5 text-[var(--text)]">
                    {row.planned_lsat_date
                      ? `${fmtDate(row.planned_lsat_date)}${row.days_to_test != null ? ` · ${row.days_to_test} days` : ""}`
                      : "—"}
                  </td>
                  <td className={`px-4 py-3.5 ${(row.days_inactive ?? 0) >= 7 ? "text-[var(--red)]" : "text-[var(--text)]"}`}>
                    {formatRelativeDays(row.days_inactive)}
                  </td>
                  <td className="px-4 py-3.5">
                    <DummyAction>
                      {row.risk_why?.toLowerCase().includes("module") ? "Send module help" : "Send check-in email"}
                    </DummyAction>
                  </td>
                </tr>
              ))}
              {stats.atRisk.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-[var(--text3)]">
                    No at-risk paid students right now.
                  </td>
                </tr>
              )}
            </tbody>
          </StudentTable>
        </WorklistCard>

        <WorklistCard
          title="Upgrade candidates"
          count={stats.upgrade.length}
          subtitle="Free, active, and past the moment of most intent."
          viewAllTo="/admin/students?view=upgrade_candidates"
        >
          <StudentTable>
            <thead>
              <tr className="border-b border-[#e4e7ec] text-[11px] font-semibold uppercase tracking-[0.66px] text-[var(--text3)]">
                <th className="px-4 py-3.5 text-left">Student</th>
                <th className="px-4 py-3.5 text-left">Signed up</th>
                <th className="px-4 py-3.5 text-left">Source</th>
                <th className="px-4 py-3.5 text-left">Why they qualify</th>
                <th className="px-4 py-3.5 text-left">Score so far</th>
                <th className="px-4 py-3.5 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.upgrade.slice(0, DASHBOARD_PREVIEW_LIMIT).map((row) => (
                <tr key={row.id} className="border-b border-[#e4e7ec]">
                  <td className="px-4 py-3.5">
                    <StudentCell row={row} nameOnly />
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text)]">{signedUpLabel(row.created_at)}</td>
                  <td className="px-4 py-3.5 text-[var(--text)]">{row.source_label || "—"}</td>
                  <td className="px-4 py-3.5 text-[var(--text)]">{row.upgrade_why ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <ScoreCell row={row} />
                  </td>
                  <td className="px-4 py-3.5">
                    <DummyAction>Send upgrade offer</DummyAction>
                  </td>
                </tr>
              ))}
              {stats.upgrade.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-[var(--text3)]">
                    No upgrade candidates right now.
                  </td>
                </tr>
              )}
            </tbody>
          </StudentTable>
        </WorklistCard>

        <WorklistCard
          title="Recent signups"
          count={stats.recent.length}
          subtitle={`Source is here so a bad paid-ads day shows the same day. · selected ${stats.rangeDays} days`}
          viewAllTo="/admin/students?view=recent_signups"
        >
          <StudentTable>
            <thead>
              <tr className="border-b border-[#e4e7ec] text-[11px] font-semibold uppercase tracking-[0.66px] text-[var(--text3)]">
                <th className="px-4 py-3.5 text-left">Student</th>
                <th className="px-4 py-3.5 text-left">Signed up</th>
                <th className="px-4 py-3.5 text-left">Source</th>
                <th className="px-4 py-3.5 text-left">First step taken</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.slice(0, DASHBOARD_PREVIEW_LIMIT).map((row) => (
                <tr key={row.id} className="border-b border-[#e4e7ec]">
                  <td className="px-4 py-3.5">
                    <StudentCell row={row} nameOnly />
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text)]">{hoursAgo(row.created_at)}</td>
                  <td className="px-4 py-3.5 text-[var(--text)]">{row.source_label || "—"}</td>
                  <td
                    className={`px-4 py-3.5 ${row.has_diagnostic || row.last_active_at ? "text-[var(--text)]" : "text-[var(--text3)]"}`}
                  >
                    {row.has_diagnostic
                      ? row.diagnostic_score != null
                        ? `Diagnostic completed · ${row.diagnostic_score}`
                        : "Diagnostic done"
                      : row.last_active_at
                        ? "Diagnostic started"
                        : "Nothing yet"}
                  </td>
                </tr>
              ))}
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-[var(--text3)]">
                    No signups in the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </StudentTable>
        </WorklistCard>
      </div>

      <article className="flex flex-col gap-3 rounded-[14px] border border-[#e3e8ef] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#062357]">Courses</h2>
          <Link to="/admin/courses" className="text-[13px] font-semibold text-[var(--accent)]">
            All courses
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e3e8ef] text-xs font-medium text-[#5b6475]">
                <th className="px-1.5 py-2">Course</th>
                <th className="px-1.5 py-2">Status</th>
                <th className="px-1.5 py-2 text-right">Enrolled</th>
                <th className="px-1.5 py-2 text-right">Active (7d)</th>
                <th className="px-1.5 py-2 text-right">Completion</th>
                <th className="px-1.5 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.slice(0, DASHBOARD_PREVIEW_LIMIT).map((course) => (
                <tr key={String(course.id)} className="border-b border-[#e3e8ef] last:border-b-0">
                  <td className="px-1.5 py-3 text-[13px] font-semibold text-[#062357]">
                    {String(course.title ?? "Untitled")}
                  </td>
                  <td className="px-1.5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        course.is_published ? "bg-[#dcfce7] text-[#166534]" : "bg-[#f1f3f7] text-[var(--text3)]"
                      }`}
                    >
                      {course.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-1.5 py-3 text-right text-[13px] text-[#062357]">{stats.paidCount}</td>
                  <td className="px-1.5 py-3 text-right text-[13px] text-[#062357]">{stats.paidActive7}</td>
                  <td className="px-1.5 py-3 text-right text-[13px] text-[#062357]">—</td>
                  <td className="px-1.5 py-3 text-right">
                    <button
                      type="button"
                      className="text-[13px] font-semibold text-[var(--accent)]"
                      onClick={() => navigate("/admin/courses")}
                    >
                      Edit curriculum
                    </button>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-1.5 py-6 text-[var(--text3)]">
                    No courses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}

function KpiCard({
  label,
  info,
  value,
  delta,
  hint,
  spark,
}: {
  label: string
  info: string
  value: string
  delta: string
  hint: string
  spark: Array<{ i: number; v: number }>
}) {
  return (
    <article className="flex h-[136px] flex-col rounded-[14px] border border-[#e4e7ec] bg-white px-[22px] py-5">
      <div className="flex items-center gap-1.5">
        <p className="text-[13px] text-[var(--text3)]">{label}</p>
        <span
          className="inline-flex size-[17px] items-center justify-center rounded-full border border-[var(--border2)] text-[10px] text-[var(--text3)]"
          title={info}
        >
          i
        </span>
      </div>
      <div className="flex items-end justify-between pt-2.5">
        <p className="text-[32px] font-bold tracking-[-0.64px] text-[var(--text)]">{value}</p>
        <div className="h-[34px] w-[92px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark}>
              <Area type="monotone" dataKey="v" stroke="#0d47a1" fill="#eef3ff" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="pt-3 text-[13px]">
        <span className="font-semibold text-[var(--teal)]">{delta}</span>
        <span className="text-[var(--text3)]"> {hint}</span>
      </p>
    </article>
  )
}

function AlertChip({
  count,
  label,
  to,
  tone,
}: {
  count: number
  label: string
  to: string
  tone: "red" | "amber" | "teal" | "muted"
}) {
  const toneClass =
    tone === "red"
      ? "border-[#fda29b] bg-[#fef3f2] text-[#b42318]"
      : tone === "amber"
        ? "border-[#fec84b] bg-[#fffaeb] text-[#93370d]"
        : tone === "teal"
          ? "border-[#abefc6] bg-[#ecfdf3] text-[#067647]"
          : "border-[#c9d0dc] bg-[#f5f6f8] text-[#3a4458]"
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 ${toneClass}`}>
      <span className="text-lg font-bold leading-none">{count}</span>
      <span className="text-[13px]">{label}</span>
    </Link>
  )
}

function WorklistCard({
  title,
  count,
  subtitle,
  viewAllTo,
  children,
}: {
  title: string
  count: number
  subtitle: string
  viewAllTo: string
  children: React.ReactNode
}) {
  return (
    <article className="overflow-hidden rounded-[14px] border border-[#e4e7ec] bg-white">
      <div className="flex items-start justify-between gap-3 px-[22px] py-3.5">
        <div>
          <h2 className="text-[18px] font-semibold text-[var(--text)]">
            {title} <span className="text-[13px] font-medium text-[var(--text3)]">· {count}</span>
          </h2>
          <p className="pt-1 text-[13px] text-[var(--text3)]">{subtitle}</p>
        </div>
        <Link to={viewAllTo} className="shrink-0 text-[13px] font-medium text-[#1d4ed8]">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </article>
  )
}

function StudentTable({ children }: { children: React.ReactNode }) {
  return <table className="w-full min-w-[900px] text-left text-sm">{children}</table>
}

function StudentCell({ row, nameOnly }: { row: AdminStudentRecord; nameOnly?: boolean }) {
  return (
    <Link to={`/admin/students?student=${row.id}`} className="block hover:opacity-80">
      <div className="text-sm font-semibold text-[var(--text)]">{row.full_name}</div>
      {!nameOnly && <div className="text-xs text-[var(--text3)]">{row.email}</div>}
    </Link>
  )
}

function ScoreCell({ row }: { row: AdminStudentRecord }) {
  if (row.diagnostic_score == null && row.latest_score == null) return <span className="text-[var(--text3)]">—</span>
  const delta = row.score_delta
  return (
    <span className="text-[var(--text)]">
      {row.diagnostic_score ?? "—"}
      {row.latest_score != null ? ` → ${row.latest_score}` : ""}
      {delta != null ? (
        <span className={`font-semibold ${delta >= 0 ? " text-[var(--teal)]" : " text-[var(--red)]"}`}>
          {" "}
          {delta >= 0 ? "+" : ""}
          {delta}
        </span>
      ) : null}
    </span>
  )
}

function DummyAction({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled
      title="Coming soon"
      className="rounded-lg border border-[var(--border2)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--text)] disabled:opacity-80"
    >
      {children}
    </button>
  )
}

function formatSigned(n: number) {
  if (n > 0) return `+${n}`
  if (n < 0) return String(n)
  return "0"
}

function formatSignedMoney(n: number) {
  const abs = Math.abs(n).toLocaleString()
  if (n > 0) return `+$${abs}`
  if (n < 0) return `-$${abs}`
  return "$0"
}

function fmtDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

function signedUpLabel(createdAt: string) {
  const t = Date.parse(createdAt)
  if (!Number.isFinite(t)) return "—"
  const days = Math.max(0, Math.floor((Date.now() - t) / 86400000))
  return `${fmtDate(createdAt)} · day ${days}`
}

function hoursAgo(createdAt: string) {
  const t = Date.parse(createdAt)
  if (!Number.isFinite(t)) return "—"
  const hours = Math.max(0, Math.floor((Date.now() - t) / 3600000))
  if (hours < 1) return "Just now"
  if (hours === 1) return "1 hour ago"
  if (hours < 24) return `${hours} hours ago`
  return formatRelativeDays(Math.floor(hours / 24))
}

export { AdminDashboardPage }
