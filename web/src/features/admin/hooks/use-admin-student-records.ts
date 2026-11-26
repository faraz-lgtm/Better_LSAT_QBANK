import { useCallback, useEffect, useState } from "react"

import { useAdminApi } from "@/features/admin/use-admin-api"
import type { AdminStudentRecord } from "@/lib/api/admin"

type CacheState = {
  rows: AdminStudentRecord[]
  loadedAt: number | null
  error: string | null
  loading: boolean
}

let sharedCache: CacheState = {
  rows: [],
  loadedAt: null,
  error: null,
  loading: false,
}

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

function setCache(next: Partial<CacheState>) {
  sharedCache = { ...sharedCache, ...next }
  notify()
}

export function useAdminStudentRecords() {
  const adminApi = useAdminApi()
  const [state, setState] = useState<CacheState>(sharedCache)

  useEffect(() => {
    const onChange = () => setState({ ...sharedCache })
    listeners.add(onChange)
    return () => {
      listeners.delete(onChange)
    }
  }, [])

  const reload = useCallback(async () => {
    if (!adminApi) {
      setCache({ error: "Admin API unavailable", loading: false })
      return
    }
    setCache({ loading: true, error: null })
    try {
      const rows = await adminApi.listStudentRecords()
      setCache({ rows, loadedAt: Date.now(), loading: false, error: null })
    } catch (e) {
      setCache({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load students",
      })
    }
  }, [adminApi])

  useEffect(() => {
    if (!adminApi) return
    if (sharedCache.loadedAt != null || sharedCache.loading) return
    void reload()
  }, [adminApi, reload])

  return {
    rows: state.rows,
    loading: state.loading,
    error: state.error,
    loadedAt: state.loadedAt,
    reload,
  }
}

/** True when the student's signup timestamp falls in [sinceMs, untilMs] (inclusive). */
export function createdAtInRange(
  row: Pick<AdminStudentRecord, "created_at">,
  sinceMs: number,
  untilMs: number,
): boolean {
  const t = Date.parse(row.created_at)
  return Number.isFinite(t) && t >= sinceMs && t <= untilMs
}

export const DEFAULT_RECENT_SIGNUP_DAYS = 30


export type RecentSignupWindow =
  | { mode: "all" }
  | { mode: "days"; days: number }
  | { mode: "range"; fromMs: number; toMs: number }

function parseLocalYmdStart(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) {
    const t = Date.parse(ymd)
    return Number.isFinite(t) ? t : null
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime()
}

function parseLocalYmdEnd(ymd: string): number | null {
  const start = parseLocalYmdStart(ymd)
  if (start == null) return null
  return start + 86400000 - 1
}

export function resolveRecentSignupWindow(opts: {
  days?: string | null
  from?: string | null
  to?: string | null
}): RecentSignupWindow {
  if (opts.from && opts.to) {
    const fromMs = parseLocalYmdStart(opts.from)
    const toMs = parseLocalYmdEnd(opts.to)
    if (fromMs != null && toMs != null) {
      return { mode: "range", fromMs, toMs }
    }
  }
  if (opts.days === "all") return { mode: "all" }
  if (opts.days) {
    const days = Number(opts.days)
    if (Number.isFinite(days) && days > 0) return { mode: "days", days }
  }
  return { mode: "days", days: DEFAULT_RECENT_SIGNUP_DAYS }
}

export function matchesRecentSignupWindow(
  row: Pick<AdminStudentRecord, "created_at">,
  window: RecentSignupWindow,
  nowMs = Date.now(),
): boolean {
  if (window.mode === "all") return true
  if (window.mode === "range") return createdAtInRange(row, window.fromMs, window.toMs)
  // Calendar window matching dashboard pills: last N days including today.
  const end = new Date(nowMs)
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const startDay = new Date(endDay)
  startDay.setDate(startDay.getDate() - (window.days - 1))
  return createdAtInRange(row, startDay.getTime(), endDay.getTime() + 86400000 - 1)
}

export function filterStudentRecords(
  rows: AdminStudentRecord[],
  opts: {
    view?: string | null
    search?: string
    plan?: string
    source?: string
    activity?: string
    recentSignupWindow?: RecentSignupWindow | null
  },
) {
  const search = (opts.search ?? "").trim().toLowerCase()
  const recentWindow =
    opts.recentSignupWindow ??
    (opts.view === "recent_signups" ? resolveRecentSignupWindow({}) : null)
  return rows.filter((row) => {
    if (opts.view === "at_risk" && !row.at_risk) return false
    if (opts.view === "upgrade_candidates" && !row.upgrade_candidate) return false
    if (opts.view === "never_diagnostic" && !row.never_started_diagnostic) return false
    if (opts.view === "test_date_under_30" && !row.test_date_under_30) return false
    if (opts.view === "cancelled_this_month" && !row.cancelled_this_month) return false
    if (opts.view === "recent_signups" && recentWindow && !matchesRecentSignupWindow(row, recentWindow)) {
      return false
    }

    if (opts.plan && opts.plan !== "all") {
      if (opts.plan === "free" && row.is_paid) return false
      if (opts.plan === "paid" && !row.is_paid) return false
      if (opts.plan !== "free" && opts.plan !== "paid" && row.plan_label !== opts.plan) return false
    }
    if (opts.source && opts.source !== "all" && row.source_label !== opts.source) return false
    if (opts.activity && opts.activity !== "all") {
      // Figma bands: high / medium / low (dormant <14d) / dormant (14+ or never active)
      if (opts.activity === "high" && row.activity_band !== "high") return false
      if (opts.activity === "medium" && row.activity_band !== "medium") return false
      if (opts.activity === "low") {
        const days = row.days_inactive
        const isLow =
          row.activity_band === "dormant" && days != null && days >= 0 && days < 14
        if (!isLow) return false
      }
      if (opts.activity === "dormant") {
        const days = row.days_inactive
        const isDormant = days == null || days >= 14
        if (!isDormant) return false
      }
      // Legacy URL values from earlier selects
      if (opts.activity === "dormant_paid" && !(row.activity_band === "dormant" && row.is_paid)) return false
      if (opts.activity === "dormant_free" && !(row.activity_band === "dormant" && !row.is_paid)) return false
    }
    if (search) {
      const hay = `${row.full_name} ${row.email}`.toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
}

export function sortStudentRecords(
  rows: AdminStudentRecord[],
  sort: string,
): AdminStudentRecord[] {
  const copy = [...rows]
  if (sort === "test_date") {
    copy.sort((a, b) => {
      const ad = a.days_to_test ?? 9999
      const bd = b.days_to_test ?? 9999
      return ad - bd
    })
  } else if (sort === "last_active") {
    copy.sort((a, b) => {
      const at = a.last_active_at ? Date.parse(a.last_active_at) : 0
      const bt = b.last_active_at ? Date.parse(b.last_active_at) : 0
      return bt - at
    })
  } else if (sort === "newest") {
    copy.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  } else if (sort === "score_gain") {
    copy.sort((a, b) => {
      const ag = a.score_delta ?? Number.NEGATIVE_INFINITY
      const bg = b.score_delta ?? Number.NEGATIVE_INFINITY
      return bg - ag
    })
  }
  return copy
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${v.replaceAll('"', '""')}"`
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map((c) => escape(c ?? "")).join(","))]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function formatRelativeDays(days: number | null | undefined): string {
  if (days == null) return "—"
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  return `${days} days ago`
}

export function monthlyEquivalentUsd(planLabel: string): number {
  if (planLabel === "1 mo") return 69
  if (planLabel === "3 mo") return 64
  if (planLabel === "6 mo") return 59
  if (planLabel === "12 mo") return 52
  return 0
}
