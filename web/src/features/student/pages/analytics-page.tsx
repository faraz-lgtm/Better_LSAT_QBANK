import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { createAnalyticsApi, type AnalyticsOverview, type KindBreakdownSection, type PracticeSessionSummary, type PriorityRow, type TrajectoryPoint } from "@/lib/api/analytics"
import { createPracticeApi, type PracticeSessionKind } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Bookmark, Loader2 } from "lucide-react"

const VALID_TABS = new Set([
  "overview",
  "priorities",
  "history",
  "drills",
  "sections",
  "preptest",
])

function tabFromSearch(raw: string | null): string {
  if (raw && VALID_TABS.has(raw)) return raw
  return "overview"
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return iso
  }
}

function KindBreakdownView({ sessionKind, title }: { sessionKind: PracticeSessionKind; title: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sections, setSections] = useState<KindBreakdownSection[]>([])
  const [total, setTotal] = useState(0)

  const analyticsApi = useMemo(() => {
    try {
      return createAnalyticsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      if (!analyticsApi) {
        setLoading(false)
        setError("Supabase env is missing.")
        return
      }
      setLoading(true)
      setError(null)
      void analyticsApi
        .getKindBreakdown(sessionKind)
        .then((d) => {
          if (!cancelled) {
            setSections(d.sections)
            setTotal(d.totalAnswered)
          }
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load")
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [analyticsApi, sessionKind])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#666d80]">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading {title}…
      </div>
    )
  }
  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }
  if (total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#dfe1e7] bg-[#f9fbfc] px-4 py-6 text-sm text-[#666d80]">
        No {title.toLowerCase()} answers recorded yet. When you use practice mode with the live API, accuracy by section
        will appear here.
      </p>
    )
  }

  if (sections.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#dfe1e7] bg-[#f9fbfc] px-4 py-6 text-sm text-[#666d80]">
        {total} answer{total === 1 ? "" : "s"} in {title.toLowerCase()} sessions, but section types are not set on those
        questions yet—breakdown by LR/RC/LG will appear once metadata is present.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#666d80]">
        {total} question{total === 1 ? "" : "s"} logged in {title.toLowerCase()} sessions.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {sections.map((s) => (
          <article key={s.sectionType} className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-[#0d47a1]">{s.sectionType}</p>
            <p className="mt-3 text-2xl font-semibold text-[#082c6b]">{s.accuracyPct}%</p>
            <p className="mt-1 text-xs text-[#666d80]">
              {s.correct}/{s.total} correct
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8ecf2]">
              <div
                className="h-full rounded-full bg-[#0d47a1]"
                style={{ width: `${Math.min(100, s.accuracyPct)}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function PrioritiesTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<PriorityRow[]>([])

  const analyticsApi = useMemo(() => {
    try {
      return createAnalyticsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      if (!analyticsApi) {
        setLoading(false)
        setError("Supabase env is missing.")
        return
      }
      setLoading(true)
      void analyticsApi
        .getPriorities()
        .then((p) => {
          if (!cancelled) setRows(p)
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load")
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [analyticsApi])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#666d80]">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading priorities…
      </div>
    )
  }
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#dfe1e7] bg-[#f9fbfc] px-4 py-6 text-sm text-[#666d80]">
        No typed question attempts yet. Priorities appear once answers are linked to question types.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.questionTypeId} className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase text-[#666d80]">{r.sectionType ?? "—"}</p>
              <p className="text-lg font-semibold text-[#082c6b]">{r.name}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                r.priorityLevel === "high"
                  ? "bg-red-100 text-red-800"
                  : r.priorityLevel === "medium"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-[#e8ecf2] text-[#4b5565]"
              }`}
            >
              {r.priorityLevel} priority
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#666d80]">
            <span>
              Accuracy: <strong className="text-[#082c6b]">{r.accuracyPct}%</strong>
            </span>
            {r.goalAccuracy != null ? (
              <span>
                Goal: <strong className="text-[#082c6b]">{r.goalAccuracy}%</strong>
                {r.gap != null ? (
                  <span className="ml-1">
                    (gap:{" "}
                    <span className="font-semibold text-[#082c6b]">{r.gap > 0 ? `+${r.gap}` : r.gap}</span>)
                  </span>
                ) : null}
              </span>
            ) : null}
            <span>
              Attempts: <strong className="text-[#082c6b]">{r.attemptCount}</strong>
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8ecf2]">
            <div className="h-full rounded-full bg-[#0d47a1]" style={{ width: `${Math.min(100, r.accuracyPct)}%` }} />
          </div>
          {r.goalAccuracy != null ? (
            <div
              className="relative -mt-2 h-0"
              style={{ marginLeft: `${Math.min(100, r.goalAccuracy)}%` }}
              title={`Goal ${r.goalAccuracy}%`}
            >
              <div className="absolute bottom-0 h-3 w-px -translate-x-1/2 bg-[#df1c41]" />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function HistoryTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<PracticeSessionSummary[]>([])
  const [pendingId, setPendingId] = useState<string | null>(null)

  const analyticsApi = useMemo(() => {
    try {
      return createAnalyticsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])
  const practiceApi = useMemo(() => {
    try {
      return createPracticeApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const load = useCallback(async () => {
    if (!analyticsApi) return
    setLoading(true)
    setError(null)
    try {
      const { sessions: s } = await analyticsApi.getSessions({ limit: 50, offset: 0 })
      setSessions(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [analyticsApi])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function toggleBookmark(s: PracticeSessionSummary) {
    if (!practiceApi) return
    const next = !s.bookmarked
    setPendingId(s.id)
    setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, bookmarked: next } : x)))
    try {
      await practiceApi.updateSession({ sessionId: s.id, bookmarked: next })
    } catch {
      setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, bookmarked: s.bookmarked } : x)))
    } finally {
      setPendingId(null)
    }
  }

  if (!analyticsApi) {
    return <p className="text-sm text-red-600">Supabase env is missing.</p>
  }
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#666d80]">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading practice history…
      </div>
    )
  }
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (sessions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#dfe1e7] bg-[#f9fbfc] px-4 py-6 text-sm text-[#666d80]">
        No sessions yet. Completed drills, sections, and PrepTests will show up here.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-[#dfe1e7] rounded-2xl border border-[#dfe1e7] bg-white shadow-sm">
      {sessions.map((s) => (
        <li
          key={s.id}
          className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${s.excluded ? "opacity-50" : ""}`}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-[#666d80]">{s.kind}</p>
            <p className="truncate font-medium text-[#082c6b]">
              {s.prepTestTitle ?? s.sectionTitle ?? "Practice session"}
            </p>
            <p className="text-xs text-[#666d80]">
              {formatShortDate(s.startedAt)}
              {s.completedAt ? ` · Completed ${formatShortDate(s.completedAt)}` : " · In progress"}
              {s.scaledScore != null ? ` · Scaled ${s.scaledScore}` : s.rawScore != null ? ` · Raw ${s.rawScore}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 rounded-xl border border-[#dfe1e7] px-3 py-1.5 text-sm text-[#082c6b] hover:bg-[#f6f8fa] disabled:opacity-50"
            disabled={pendingId === s.id || !practiceApi}
            onClick={() => void toggleBookmark(s)}
            aria-pressed={s.bookmarked}
          >
            <Bookmark className={`size-4 ${s.bookmarked ? "fill-[#0d47a1] text-[#0d47a1]" : ""}`} aria-hidden />
            {s.bookmarked ? "Saved" : "Bookmark"}
          </button>
        </li>
      ))}
    </ul>
  )
}

function OverviewTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([])

  const analyticsApi = useMemo(() => {
    try {
      return createAnalyticsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      if (!analyticsApi) {
        setLoading(false)
        setError("Supabase env is missing.")
        return
      }
      setLoading(true)
      void Promise.all([analyticsApi.getOverview(), analyticsApi.getTrajectory()])
        .then(([o, t]) => {
          if (!cancelled) {
            setOverview(o)
            setTrajectory(t)
          }
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load")
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [analyticsApi])

  const chartData = useMemo(
    () =>
      trajectory.map((p) => ({
        shortDate: formatShortDate(p.completedAt),
        score: p.scaledScore ?? p.rawScore ?? 0,
      })),
    [trajectory],
  )

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#666d80]">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading overview…
      </div>
    )
  }
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!overview) return null

  return (
    <>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#666d80]">Best scaled (PrepTest)</p>
          <p className="mt-2 text-3xl font-semibold text-[#082c6b]">
            {overview.bestScaledScore != null ? overview.bestScaledScore : "—"}
          </p>
          <p className="mt-1 text-sm text-[#666d80]">Across {overview.completedPrepTestCount} completed tests</p>
        </article>
        <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#666d80]">Avg scaled (PrepTest)</p>
          <p className="mt-2 text-3xl font-semibold text-[#082c6b]">
            {overview.averageScaledScore != null ? overview.averageScaledScore : "—"}
          </p>
          <p className="mt-1 text-sm text-[#666d80]">When score table exists</p>
        </article>
        <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#666d80]">Questions answered</p>
          <p className="mt-2 text-3xl font-semibold text-[#082c6b]">{overview.totalQuestionsAnswered}</p>
          <p className="mt-1 text-sm text-[#666d80]">All modes</p>
        </article>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#666d80]">Drill accuracy</p>
          <p className="mt-2 text-3xl font-semibold text-[#082c6b]">
            {overview.drillAccuracyPct != null ? `${overview.drillAccuracyPct}%` : "—"}
          </p>
          <p className="mt-1 text-sm text-[#666d80]">{overview.totalDrillQuestionsAnswered} drill answers</p>
        </article>
        <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#666d80]">Avg LR missed / PrepTest</p>
          <p className="mt-2 text-3xl font-semibold text-[#082c6b]">
            {overview.averageLrMissedPerPrepTest != null ? overview.averageLrMissedPerPrepTest : "—"}
          </p>
          <p className="mt-1 text-sm text-[#666d80]">Latest attempt per question</p>
        </article>
        <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#666d80]">Avg RC missed / PrepTest</p>
          <p className="mt-2 text-3xl font-semibold text-[#082c6b]">
            {overview.averageRcMissedPerPrepTest != null ? overview.averageRcMissedPerPrepTest : "—"}
          </p>
          <p className="mt-1 text-sm text-[#666d80]">Latest attempt per question</p>
        </article>
      </div>

      <section className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-[#082c6b]">Score trajectory</h2>
        <p className="mt-1 text-sm text-[#666d80]">Completed PrepTests over time (scaled when available, else raw).</p>
        {chartData.length === 0 ? (
          <p className="mt-6 text-sm text-[#666d80]">Complete a PrepTest to see your trajectory.</p>
        ) : (
          <div className="mt-6 h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf2" />
                <XAxis dataKey="shortDate" tick={{ fontSize: 12, fill: "#666d80" }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12, fill: "#666d80" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #dfe1e7" }}
                  formatter={(value: number) => [value, "Score"]}
                />
                <Line type="monotone" dataKey="score" stroke="#0d47a1" strokeWidth={2} dot={{ r: 4, fill: "#0d47a1" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  )
}

function tabLinkClass(active: boolean): string {
  if (active) return "border-[#0d47a1] bg-[#0d47a1] text-white"
  return "border-[#dfe1e7] bg-white text-[#082c6b] hover:bg-[#f6f8fa]"
}

function AnalyticsPage() {
  const [params] = useSearchParams()
  const tab = tabFromSearch(params.get("tab"))

  const tabLinks: { id: string; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "priorities", label: "Priorities" },
    { id: "history", label: "Practice history" },
    { id: "drills", label: "Drills" },
    { id: "sections", label: "Sections" },
    { id: "preptest", label: "PrepTest" },
  ]

  return (
    <>
      <StudentSubnavStrip crumbs={[{ label: "Analytics" }]} />
      <StudentMain>
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#dfe1e7] pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Analytics</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#082c6b]">Your performance</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-xl border-[#0d47a1] text-[#0d47a1]" disabled>
              Export
            </Button>
          </div>
        </div>

        <nav className="mb-6 flex flex-wrap gap-2" aria-label="Analytics sections">
          {tabLinks.map((t) => (
            <Link
              key={t.id}
              to={t.id === "overview" ? "/app/analytics" : `/app/analytics?tab=${t.id}`}
              className={`rounded-xl border px-3 py-1.5 text-sm font-medium shadow-sm ${tabLinkClass(tab === t.id)}`}
              replace
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {tab === "overview" ? <OverviewTab /> : null}
        {tab === "priorities" ? <PrioritiesTab /> : null}
        {tab === "history" ? <HistoryTab /> : null}
        {tab === "drills" ? <KindBreakdownView sessionKind="DRILL" title="Drills" /> : null}
        {tab === "sections" ? <KindBreakdownView sessionKind="SECTION" title="Sections" /> : null}
        {tab === "preptest" ? <KindBreakdownView sessionKind="PREPTEST" title="PrepTest" /> : null}
      </StudentMain>
    </>
  )
}

export { AnalyticsPage }
