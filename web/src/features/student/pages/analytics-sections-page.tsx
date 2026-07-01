import { useEffect, useMemo, useState } from "react"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"

import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { AnalyticsPrepTestHistory } from "@/features/student/components/analytics-prep-test-history"
import {
  TimeRangeFilter,
  takeLastByTimeRange,
  type TimeRangeValue,
} from "@/features/student/components/time-range-filter"
import type { SectionProgressPoint, SectionSummary } from "@/features/student/lib/mock-analytics-sections"
import { mapPrepTestSessionToHistoryEntry } from "@/features/student/analytics/map-analytics"
import { useAnalyticsApi, usePracticeApi } from "@/features/student/analytics/hooks/use-analytics-api"
import type { KindBreakdownSection, PracticeSessionSummary } from "@/lib/api/analytics"
import type { PrepTestHistoryEntry } from "@/features/student/lib/mock-analytics-preptests"

const Y_AXIS_LABELS = [100, 84, 68, 52, 36, 20] as const

const SECTION_SCORE_TABS = [
  { id: "raw", label: "Raw Score" },
  { id: "ptEquivalent", label: "PT equivalent score" },
] as const

type SectionScoreTab = (typeof SECTION_SCORE_TABS)[number]["id"]

function SectionScoreTabs({ value, onChange }: { value: SectionScoreTab; onChange: (next: SectionScoreTab) => void }) {
  return (
    <div className="flex h-10 flex-wrap items-center gap-2 rounded-[10px] bg-white p-1">
      {SECTION_SCORE_TABS.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            className={cn(
              "flex min-h-8 items-center justify-center rounded-[10px] px-3 py-1.5 text-sm font-semibold leading-[1.5] tracking-[0.02em] transition-colors hover:rounded-[10px] active:rounded-[10px] focus-visible:rounded-[10px]",
              active ? "bg-[#0d47a1] text-white" : "text-[#666d80] hover:bg-[#f3f7ff]",
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function SectionProgressChart({ points, tab }: { points: SectionProgressPoint[]; tab: SectionScoreTab }) {
  const minVal = Y_AXIS_LABELS[Y_AXIS_LABELS.length - 1]
  const maxVal = Y_AXIS_LABELS[0]
  const range = maxVal - minVal
  const stepX = 100 / Math.max(1, points.length)

  const yFor = (value: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, value))
    return ((maxVal - clamped) / range) * 100
  }
  const xFor = (index: number) => stepX * index + stepX / 2

  const pickValue = (point: SectionProgressPoint) => (tab === "raw" ? point.rawScore : point.ptEquivalent)

  const linePoints = points.map((p, i) => ({ x: xFor(i), y: yFor(pickValue(p)) }))
  const linePortion = linePoints.slice(0, Math.min(5, linePoints.length))
  const linePortionPolyline = linePortion.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")

  return (
    <div className="w-full">
      <div className="flex h-[300px] w-full items-stretch gap-4">
        <div className="flex h-full flex-col justify-between py-1 pr-2 text-sm font-medium text-[#62748e]">
          {Y_AXIS_LABELS.map((label) => (
            <span key={label} className="leading-5">
              {label}
            </span>
          ))}
        </div>
        <div className="relative flex-1 pb-8">
          <div className="absolute inset-0 bottom-8 flex flex-col justify-between" aria-hidden>
            {Y_AXIS_LABELS.map((label) => (
              <div key={label} className="h-px w-full bg-[#e5e7eb]" />
            ))}
          </div>
          <svg
            className="absolute inset-0 bottom-8 h-[calc(100%-2rem)] w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <polygon
              points={`${linePortion[0]?.x ?? 0},100 ${linePortionPolyline} ${linePortion[linePortion.length - 1]?.x ?? 0},100`}
              fill="#0d47a1"
              fillOpacity="0.08"
            />
            <polyline
              points={linePortionPolyline}
              fill="none"
              stroke="#0d47a1"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <svg
            className="absolute inset-0 bottom-8 h-[calc(100%-2rem)] w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {linePoints.map((p, i) => (
              <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="1" fill="#df1c41" />
            ))}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between gap-0.5 text-[11px] leading-4 text-[#6a7282] sm:text-xs">
            {points.map((p) => (
              <span key={p.label} className="min-w-0 flex-1 truncate text-center">
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionStatPair({ summary }: { summary: SectionSummary }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <article className="ds-analytics-stat ds-analytics-stat--pair min-w-0">
        <p className="ds-analytics-stat__label">BEST SCORE</p>
        <p className="ds-analytics-stat__value" style={{ color: summary.bestAccent }}>
          {summary.bestScore}
        </p>
      </article>
      <article className="ds-analytics-stat ds-analytics-stat--pair min-w-0">
        <p className="ds-analytics-stat__label">AVERAGE SCORE</p>
        <p className="ds-analytics-stat__value" style={{ color: summary.averageAccent }}>
          {summary.averageScore}
        </p>
      </article>
    </div>
  )
}

type SectionColumnProps = {
  badge: "LR" | "RC"
  title: string
  badgeBg: string
  badgeColor: string
  progressTitle: string
  summary: SectionSummary
  points: SectionProgressPoint[]
  scoreTab: SectionScoreTab
  onScoreTabChange: (next: SectionScoreTab) => void
}

function SectionColumn({
  badge,
  title,
  badgeBg,
  badgeColor,
  progressTitle,
  summary,
  points,
  scoreTab,
  onScoreTabChange,
}: SectionColumnProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="rounded-[20px] bg-[#f6f8fa] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: badgeBg }}
          >
            <span className="text-xl font-black leading-[1.5] tracking-[0.02em]" style={{ color: badgeColor }}>
              {badge}
            </span>
          </div>
          <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">{title}</h2>
        </div>
      </div>

      <SectionStatPair summary={summary} />

      <div className="flex min-h-[382px] flex-1 flex-col gap-[18px] rounded-[20px] bg-[#f6f8fa] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">{progressTitle}</p>
          <SectionScoreTabs value={scoreTab} onChange={onScoreTabChange} />
        </div>
        <SectionProgressChart points={points} tab={scoreTab} />
      </div>
    </div>
  )
}

function sectionSummaryFromSessions(
  sessions: PracticeSessionSummary[],
  sectionType: "LR" | "RC",
  breakdown?: KindBreakdownSection,
): SectionSummary {
  const filtered = sessions.filter((s) => s.sectionType === sectionType && s.completedAt)
  const scores = filtered.map((s) => s.rawScore ?? 0)
  const best = scores.length ? Math.max(...scores) : 0
  const avgAcc = breakdown?.accuracyPct ?? 0
  return {
    bestScore: String(best),
    bestAccent: "#0d47a1",
    averageScore: `${avgAcc}%`,
    averageAccent: sectionType === "LR" ? "#ae8b00" : "#ff9d51",
  }
}

function sectionProgressFromSessions(
  sessions: PracticeSessionSummary[],
  sectionType: "LR" | "RC",
): SectionProgressPoint[] {
  return sessions
    .filter((s) => s.sectionType === sectionType && s.completedAt)
    .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
    .map((s, i) => ({
      label: s.sectionTitle?.slice(0, 8) ?? `Sec ${i + 1}`,
      rawScore: s.rawScore ?? 0,
      ptEquivalent: s.scaledScore ?? s.rawScore ?? 0,
    }))
}

function AnalyticsSectionsPage() {
  const analyticsApi = useAnalyticsApi()
  const practiceApi = usePracticeApi()
  const [loading, setLoading] = useState(true)
  const [sectionSessions, setSectionSessions] = useState<PracticeSessionSummary[]>([])
  const [prepHistory, setPrepHistory] = useState<PrepTestHistoryEntry[]>([])
  const [breakdownSections, setBreakdownSections] = useState<KindBreakdownSection[]>([])
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("all")
  const [lrScoreTab, setLrScoreTab] = useState<SectionScoreTab>("ptEquivalent")
  const [rcScoreTab, setRcScoreTab] = useState<SectionScoreTab>("ptEquivalent")
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!analyticsApi) {
      setLoading(false)
      return
    }
    setLoading(true)
    void Promise.all([
      analyticsApi.getSessions({ kind: "SECTION", limit: 100 }),
      analyticsApi.getSessions({ kind: "PREPTEST", limit: 50 }),
      analyticsApi.getKindBreakdown("SECTION"),
    ])
      .then(([sections, preptests, breakdown]) => {
        setSectionSessions(sections.sessions)
        setPrepHistory(
          preptests.sessions.map(mapPrepTestSessionToHistoryEntry).filter((e): e is PrepTestHistoryEntry => e != null),
        )
        setBreakdownSections(breakdown.sections)
        setBookmarks(
          Object.fromEntries(
            preptests.sessions.map((s) => [s.id, s.bookmarked]),
          ),
        )
      })
      .finally(() => setLoading(false))
  }, [analyticsApi])

  const lrBreakdown = breakdownSections.find((s) => s.sectionType === "LR")
  const rcBreakdown = breakdownSections.find((s) => s.sectionType === "RC")
  const lrSummary = useMemo(
    () => sectionSummaryFromSessions(sectionSessions, "LR", lrBreakdown),
    [sectionSessions, lrBreakdown],
  )
  const rcSummary = useMemo(
    () => sectionSummaryFromSessions(sectionSessions, "RC", rcBreakdown),
    [sectionSessions, rcBreakdown],
  )

  const lrPoints = useMemo(
    () => takeLastByTimeRange(sectionProgressFromSessions(sectionSessions, "LR"), timeRange),
    [sectionSessions, timeRange],
  )
  const rcPoints = useMemo(
    () => takeLastByTimeRange(sectionProgressFromSessions(sectionSessions, "RC"), timeRange),
    [sectionSessions, timeRange],
  )

  const entries = useMemo(
    () => prepHistory.map((entry) => ({ ...entry, bookmarked: bookmarks[entry.id] ?? entry.bookmarked })),
    [bookmarks, prepHistory],
  )

  const visibleEntries = useMemo(() => {
    const ranged = takeLastByTimeRange(entries, timeRange)
    return bookmarkedOnly ? ranged.filter((entry) => entry.bookmarked) : ranged
  }, [entries, bookmarkedOnly, timeRange])

  function handleToggleBookmark(id: string) {
    const next = !(bookmarks[id] ?? false)
    setBookmarks((current) => ({ ...current, [id]: next }))
    if (practiceApi) {
      void practiceApi.updateSession({ sessionId: id, bookmarked: next })
    }
  }

  if (loading) {
    return (
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading section analytics…" />
      </StudentMain>
    )
  }

  return (
    <StudentMain>
        <div className="mb-6 flex flex-wrap items-center justify-end gap-4">
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>

        <section className="mb-6 rounded-[20px] border border-[#dfe1e7] bg-white p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
            <SectionColumn
              badge="LR"
              title="Logical Reasoning"
              badgeBg="#fffbeb"
              badgeColor="#ae8b00"
              progressTitle="LR PROGRESS"
              summary={lrSummary}
              points={lrPoints}
              scoreTab={lrScoreTab}
              onScoreTabChange={setLrScoreTab}
            />
            <div className="hidden w-px shrink-0 self-stretch bg-[#dfe1e7] xl:block" aria-hidden />
            <SectionColumn
              badge="RC"
              title="Reading Comprehension"
              badgeBg="#fff3ea"
              badgeColor="#ff9d51"
              progressTitle="RC PROGRESS"
              summary={rcSummary}
              points={rcPoints}
              scoreTab={rcScoreTab}
              onScoreTabChange={setRcScoreTab}
            />
          </div>
        </section>

        <AnalyticsPrepTestHistory
          visibleEntries={visibleEntries}
          bookmarkedOnly={bookmarkedOnly}
          onBookmarkedOnlyChange={setBookmarkedOnly}
          onToggleBookmark={handleToggleBookmark}
        />
      </StudentMain>
  )
}

export { AnalyticsSectionsPage }
