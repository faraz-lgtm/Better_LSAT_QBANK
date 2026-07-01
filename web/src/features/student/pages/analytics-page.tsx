import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Bookmark } from "lucide-react"

import { StudentPageLoader } from "@/features/student/components/student-page-loader"

import { StudentMain } from "@/features/student/components/student-main"
import {
  ScoreProgressChart,
  ScoreProgressTabs,
  SectionCard,
  StatTile,
  type ScoreProgressTab,
} from "@/features/student/analytics/components/analytics-overview-ui"
import {
  mapOverviewToHeadlineStats,
  mapOverviewToSecondaryStats,
  mapPrioritiesToSections,
  mapTrajectoryToScoreProgress,
} from "@/features/student/analytics/map-analytics"
import { useAnalyticsApi, usePracticeApi } from "@/features/student/analytics/hooks/use-analytics-api"
import {
  TimeRangeFilter,
  takeLastByTimeRange,
  type TimeRangeValue,
} from "@/features/student/components/time-range-filter"
import type { AnalyticsOverview, PracticeSessionSummary, PriorityRow } from "@/lib/api/analytics"

const VALID_TABS = new Set(["overview", "priorities", "history"])

function tabFromSearch(raw: string | null): string {
  if (raw && VALID_TABS.has(raw)) return raw
  return "overview"
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return iso
  }
}

function PrioritiesTab() {
  const analyticsApi = useAnalyticsApi()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<PriorityRow[]>([])

  useEffect(() => {
    if (!analyticsApi) {
      setLoading(false)
      setError("Supabase env is missing.")
      return
    }
    setLoading(true)
    void analyticsApi
      .getPriorities()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [analyticsApi])

  if (loading) {
    return <StudentPageLoader centered className="min-h-0 flex-1" label="Loading priorities…" />
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
              </span>
            ) : null}
            <span>
              Attempts: <strong className="text-[#082c6b]">{r.attemptCount}</strong>
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

function HistoryTab() {
  const analyticsApi = useAnalyticsApi()
  const practiceApi = usePracticeApi()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<PracticeSessionSummary[]>([])
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    if (!analyticsApi) return
    setLoading(true)
    void analyticsApi
      .getSessions({ limit: 50, offset: 0 })
      .then(({ sessions: s }) => setSessions(s))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [analyticsApi])

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

  if (!analyticsApi) return <p className="text-sm text-red-600">Supabase env is missing.</p>
  if (loading) {
    return <StudentPageLoader centered className="min-h-0 flex-1" label="Loading practice history…" />
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
  const analyticsApi = useAnalyticsApi()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [scoreTab, setScoreTab] = useState<ScoreProgressTab>("both")
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("all")
  const [trajectory, setTrajectory] = useState<ReturnType<typeof mapTrajectoryToScoreProgress>>([])
  const [sections, setSections] = useState<ReturnType<typeof mapPrioritiesToSections>>([])

  useEffect(() => {
    if (!analyticsApi) {
      setLoading(false)
      setError("Supabase env is missing.")
      return
    }
    setLoading(true)
    void Promise.all([
      analyticsApi.getOverview(),
      analyticsApi.getTrajectory(),
      analyticsApi.getPriorities(),
    ])
      .then(([o, t, p]) => {
        setOverview(o)
        const filtered = takeLastByTimeRange(t, timeRange)
        setTrajectory(mapTrajectoryToScoreProgress(filtered))
        setSections(mapPrioritiesToSections(p))
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [analyticsApi, timeRange])

  const headlineStats = useMemo(
    () => (overview ? mapOverviewToHeadlineStats(overview) : []),
    [overview],
  )
  const secondaryStats = useMemo(
    () => (overview ? mapOverviewToSecondaryStats(overview) : []),
    [overview],
  )

  if (loading) {
    return <StudentPageLoader centered className="min-h-0 flex-1" label="Loading overview…" />
  }
  if (error) return <p className="text-sm text-red-600">{error}</p>

  return (
    <>
      <section className="mb-6 flex w-full flex-col gap-6 rounded-[20px] border border-[#dfe1e7] bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">Overview</h2>
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} className="shrink-0" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {headlineStats.map((stat) => (
            <StatTile key={stat.id} stat={stat} />
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {secondaryStats.map((stat) => (
            <StatTile key={stat.id} stat={stat} />
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-[20px] border border-[#dfe1e7] bg-white p-6">
        <div className="flex flex-col gap-[18px] rounded-[20px] bg-[#f6f8fa] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[14px] font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
              PREPTESTS SCORE PROGRES
            </h2>
            <ScoreProgressTabs value={scoreTab} onChange={setScoreTab} />
          </div>
          <ScoreProgressChart points={trajectory} tab={scoreTab} />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-[#e5e7eb] pt-5">
            <span className="flex items-center gap-2 text-sm leading-[1.5] tracking-[0.02em] text-[#666d80]">
              <span className="size-4 rounded-full bg-[#0d47a1]" aria-hidden />
              Regular Score
            </span>
            <span className="flex items-center gap-2 text-sm leading-[1.5] tracking-[0.02em] text-[#666d80]">
              <span className="size-4 rounded-full bg-[#ae8b00]" aria-hidden />
              Blind Review
            </span>
          </div>
        </div>
      </section>

      {sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#dfe1e7] bg-[#f9fbfc] px-4 py-6 text-sm text-[#666d80]">
          Question-type breakdown appears once you answer questions linked to LR/RC types.
        </p>
      ) : (
        sections.map((section) => <SectionCard key={section.id} section={section} />)
      )}
    </>
  )
}

function AnalyticsPage() {
  const [params] = useSearchParams()
  const tab = tabFromSearch(params.get("tab"))

  return (
    <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
      {tab === "overview" ? <OverviewTab /> : null}
      {tab === "priorities" ? <PrioritiesTab /> : null}
      {tab === "history" ? <HistoryTab /> : null}
    </StudentMain>
  )
}

export { AnalyticsPage }
