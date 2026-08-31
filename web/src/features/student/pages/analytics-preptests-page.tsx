import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react"

import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { StudentMain } from "@/features/student/components/student-main"
import {
  AnalyticsScoreProgressPanel,
  AnalyticsStatsGrid,
} from "@/features/student/analytics/components/analytics-overview-ui"
import { AnalyticsPrepTestHistory } from "@/features/student/components/analytics-prep-test-history"
import type { AnalyticsStat } from "@/features/student/lib/mock-analytics"
import {
  TimeRangeFilter,
  type TimeRangeValue,
} from "@/features/student/components/time-range-filter"
import {
  computePrepTestStats,
  filterPrepTestsByTimeRange,
  getPrepTestHistoryEntries,
  getPrepTestProgressPoints,
  sortPrepTestRecords,
  type PrepTestHistorySort,
  type PrepTestProgressPoint,
  type PrepTestRecord,
} from "@/features/student/lib/mock-analytics-preptests"
import { mapSessionToPrepTestRecord } from "@/features/student/analytics/map-analytics"
import {
  filterBookmarkedOnly,
  persistSessionBookmark,
  sessionBookmarkState,
  withSessionBookmark,
} from "@/features/student/analytics/session-bookmarks"
import { prepTestHubHref } from "@/features/student/preptests/preptest-hub-navigation"
import { useAnalyticsApi, usePracticeApi } from "@/features/student/analytics/hooks/use-analytics-api"
import {
  LSAT_SCALED_Y_AXIS_LABELS,
  buildChartYAxisLabels,
  resolveRawScoreAxisMax,
} from "@/features/student/analytics/chart-y-axis"
import { cn } from "@/lib/utils"

const SCORE_TABS = [
  { id: "scaled", label: "Scaled score" },
  { id: "raw", label: "Raw score" },
] as const

type ScoreTab = (typeof SCORE_TABS)[number]["id"]

type HistorySort = PrepTestHistorySort

const HISTORY_SORT_OPTIONS: Array<{ id: HistorySort; label: string }> = [
  { id: "date-desc", label: "Most recent" },
  { id: "date-asc", label: "Oldest first" },
  { id: "score-desc", label: "Highest score" },
  { id: "score-asc", label: "Lowest score" },
]

function formatSignedNumber(value: number): string {
  if (value > 0) return `+${value}`
  if (value < 0) return `${value}`
  return "0"
}

function ordinal(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

function PrepTestScoreTabs({ value, onChange }: { value: ScoreTab; onChange: (next: ScoreTab) => void }) {
  return (
    <div className="flex h-10 flex-wrap items-center gap-2 rounded-[16px] bg-white p-1">
      {SCORE_TABS.map((tab) => {
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

function PrepTestScoreProgressChart({ points, tab }: { points: PrepTestProgressPoint[]; tab: ScoreTab }) {
  const yAxisLabels =
    tab === "raw"
      ? buildChartYAxisLabels(resolveRawScoreAxisMax(points.map((p) => p.rawMax)))
      : LSAT_SCALED_Y_AXIS_LABELS
  const minVal = yAxisLabels[yAxisLabels.length - 1] ?? 0
  const maxVal = yAxisLabels[0] ?? 1
  const range = Math.max(1, maxVal - minVal)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (points.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-[#dfe1e7] text-sm text-[#666d80]">
        No PrepTests in the selected range.
      </div>
    )
  }

  const stepX = 100 / Math.max(1, points.length)

  const yFor = (value: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, value))
    return ((maxVal - clamped) / range) * 100
  }
  const xFor = (index: number) => stepX * index + stepX / 2

  const pickValue = (p: PrepTestProgressPoint) => (tab === "raw" ? p.rawScore : p.scaledScore)

  const linePoints = points.map((p, i) => ({ x: xFor(i), y: yFor(pickValue(p)) }))
  const polyline = linePoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
  const areaPolygon = `${linePoints[0].x},100 ${polyline} ${linePoints[linePoints.length - 1].x},100`

  return (
    <div className="w-full">
      <div className="flex h-[300px] w-full items-stretch gap-4">
        <div className="flex h-full flex-col justify-between py-1 pr-2 text-sm font-medium text-[#062357]">
          {yAxisLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="leading-5">
              {label}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
            {yAxisLabels.map((label, index) => (
              <div key={`${label}-${index}`} className="h-px w-full bg-[#e5e7eb]" />
            ))}
          </div>
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <polygon points={areaPolygon} fill="#0d47a1" fillOpacity="0.08" />
            <polyline
              points={polyline}
              fill="none"
              stroke="#0d47a1"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute inset-0 flex">
            {points.map((point, i) => {
              const value = tab === "raw" ? `${point.rawScore}/${point.rawMax}` : `${point.scaledScore}`
              const isActive = hoverIndex === i
              return (
                <button
                  key={point.id}
                  type="button"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onFocus={() => setHoverIndex(i)}
                  onBlur={() => setHoverIndex(null)}
                  className="group relative flex-1 cursor-default focus:outline-none"
                  aria-label={`${point.test}: ${value}`}
                >
                  <span
                    className={cn(
                      "absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#df1c41] transition-transform",
                      isActive ? "scale-150 ring-2 ring-[#df1c41]/30" : "",
                    )}
                    style={{ left: "50%", top: `${linePoints[i].y}%` }}
                    aria-hidden
                  />
                  {isActive ? (
                    <span
                      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[#062357] px-2 py-1 text-xs font-semibold text-white shadow-lg"
                      style={{ left: "50%", top: `calc(${linePoints[i].y}% - 8px)` }}
                    >
                      {point.test}: {value}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function HistorySortMenu({ value, onChange }: { value: HistorySort; onChange: (next: HistorySort) => void }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (containerRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  const activeLabel = HISTORY_SORT_OPTIONS.find((option) => option.id === value)?.label ?? "Sort"
  const Icon = value.endsWith("desc") ? ArrowDownAZ : ArrowUpAZ

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((c) => !c)}
        className="flex h-10 items-center gap-2 rounded-[16px] border border-[#dfe1e7] bg-white px-3 text-sm font-semibold text-[#062357] hover:bg-[#f3f7ff]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Icon className="size-4 text-[#666d80]" aria-hidden />
        <span>{activeLabel}</span>
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Sort PrepTest history"
          className="absolute right-0 z-30 mt-2 min-w-[200px] overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
        >
          {HISTORY_SORT_OPTIONS.map((option) => {
            const active = option.id === value
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex h-10 w-full items-center rounded-[16px] px-3 text-sm font-medium tracking-[0.02em] transition-colors",
                    active ? "bg-[#f3f7ff] text-[#0d47a1]" : "text-[#062357] hover:bg-[#f6f8fa]",
                  )}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function AnalyticsPrepTestsPage() {
  const navigate = useNavigate()
  const analyticsApi = useAnalyticsApi()
  const practiceApi = usePracticeApi()
  const [loading, setLoading] = useState(true)
  const [prepRecords, setPrepRecords] = useState<PrepTestRecord[]>([])
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("all")
  const [scoreTab, setScoreTab] = useState<ScoreTab>("raw")
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [historySort, setHistorySort] = useState<HistorySort>("date-desc")

  useEffect(() => {
    if (!analyticsApi) {
      setLoading(false)
      return
    }
    setLoading(true)
    void analyticsApi
      .getSessions({ kind: "PREPTEST", limit: 100 })
      .then(({ sessions }) => {
        setPrepRecords(
          sessions.map(mapSessionToPrepTestRecord).filter((r): r is PrepTestRecord => r != null),
        )
      })
      .finally(() => setLoading(false))
  }, [analyticsApi])

  const rangedRecords = useMemo(() => filterPrepTestsByTimeRange(prepRecords, timeRange), [prepRecords, timeRange])

  const stats = useMemo(() => computePrepTestStats(rangedRecords), [rangedRecords])
  const headlineStats = useMemo((): AnalyticsStat[] => {
    if (!stats) return []
    return [
      {
        id: "best-score",
        label: "BEST SCORE",
        value: String(stats.bestScore),
        accent: "#0d47a1",
        caption: `PERCENTILE: ${ordinal(stats.bestPercentile)}`,
      },
      {
        id: "average-score",
        label: "AVERAGE SCORE",
        value: String(stats.averageScore),
        accent: "#5463a9",
        caption: `PERCENTILE: ${ordinal(stats.averagePercentile)}`,
      },
    ]
  }, [stats])
  const secondaryStats = useMemo((): AnalyticsStat[] => {
    if (!stats) return []
    return [
      {
        id: "avg-lr",
        label: "AVERAGE LR",
        value: formatSignedNumber(stats.averageLrMissed),
        accent: "#00bc54",
      },
      {
        id: "avg-rc",
        label: "AVERAGE RC",
        value: formatSignedNumber(stats.averageRcMissed),
        accent: "#0bbcc9",
      },
      {
        id: "best-br",
        label: "BEST BLIND REVIEW",
        value: String(stats.bestBlindReview),
        accent: "#df1c41",
        caption: `Average BR: ${stats.averageBlindReview}`,
      },
      {
        id: "avg-br-diff",
        label: "AVG. BR DIFFERENCE",
        value: formatSignedNumber(stats.averageBlindReviewDifference),
        accent: "#956321",
        caption: `High: ${formatSignedNumber(stats.blindReviewDifferenceHigh)}  Low: ${formatSignedNumber(stats.blindReviewDifferenceLow)}`,
      },
    ]
  }, [stats])
  const progressPoints = useMemo(() => getPrepTestProgressPoints(rangedRecords), [rangedRecords])
  const allStatTiles = useMemo(
    () => [...headlineStats, ...secondaryStats],
    [headlineStats, secondaryStats],
  )

  const sortedRecords = useMemo(
    () => sortPrepTestRecords(rangedRecords, historySort),
    [rangedRecords, historySort],
  )

  const historyEntries = useMemo(() => getPrepTestHistoryEntries(sortedRecords), [sortedRecords])

  const visibleEntries = useMemo(
    () => filterBookmarkedOnly(historyEntries, bookmarkedOnly),
    [historyEntries, bookmarkedOnly],
  )

  const handleToggleBookmark = useCallback(
    (id: string) => {
      const previous = sessionBookmarkState(prepRecords, id)
      const next = !previous
      setPrepRecords((current) => withSessionBookmark(current, id, next))
      void persistSessionBookmark({
        sessionId: id,
        bookmarked: next,
        practiceApi,
        onFailure: () => setPrepRecords((current) => withSessionBookmark(current, id, previous)),
      })
    },
    [practiceApi, prepRecords],
  )

  const handleSelectEntry = useCallback(
    (id: string) => {
      navigate(`/app/analytics/preptests/results/${encodeURIComponent(id)}`)
    },
    [navigate],
  )

  const handleOpenPractice = useCallback(
    (sessionId: string) => {
      const record = sortedRecords.find((row) => row.id === sessionId)
      const prepTestId = record?.prepTestId?.trim() || sessionId
      navigate(prepTestHubHref(prepTestId))
    },
    [navigate, sortedRecords],
  )

  if (loading) {
    return (
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading PrepTest analytics…" />
      </StudentMain>
    )
  }

  return (
    <StudentMain>
        <div className="mb-6 flex flex-wrap items-center justify-end gap-4">
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>

        {stats ? (
          <section className="mb-6 grid gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]">
            <AnalyticsStatsGrid stats={allStatTiles} />
            <AnalyticsScoreProgressPanel
              title="Score progress"
              legend={<PrepTestScoreTabs value={scoreTab} onChange={setScoreTab} />}
              chart={<PrepTestScoreProgressChart points={progressPoints} tab={scoreTab} />}
            />
          </section>
        ) : (
          <p className="mb-6 rounded-2xl border border-dashed border-[#dfe1e7] bg-[#f9fbfc] px-6 py-8 text-center text-sm text-[#666d80]">
            No PrepTests recorded in this range. Try widening the time range.
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
          <HistorySortMenu value={historySort} onChange={setHistorySort} />
        </div>

        <AnalyticsPrepTestHistory
          title="PrepTest History"
          emptyNoun="PrepTests"
          visibleEntries={visibleEntries}
          bookmarkedOnly={bookmarkedOnly}
          onBookmarkedOnlyChange={setBookmarkedOnly}
          onToggleBookmark={handleToggleBookmark}
          onSelectEntry={handleSelectEntry}
          onOpenPractice={handleOpenPractice}
        />
      </StudentMain>
  )
}

export { AnalyticsPrepTestsPage }
