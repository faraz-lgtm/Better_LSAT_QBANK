import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react"

import { cn } from "@/lib/utils"
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
  type PrepTestProgressPoint,
  type PrepTestRecord,
} from "@/features/student/lib/mock-analytics-preptests"
import { mapSessionToPrepTestRecord } from "@/features/student/analytics/map-analytics"
import { useAnalyticsApi, usePracticeApi } from "@/features/student/analytics/hooks/use-analytics-api"

const Y_AXIS_LABELS = [100, 84, 68, 52, 36, 20] as const
const BOOKMARKS_STORAGE_KEY = "analytics:preptests:bookmarks"

const SCORE_TABS = [
  { id: "scaled", label: "Scaled score" },
  { id: "raw", label: "Raw score" },
] as const

type ScoreTab = (typeof SCORE_TABS)[number]["id"]

type HistorySort = "date-desc" | "date-asc" | "score-desc" | "score-asc"

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
    <div className="flex h-10 flex-wrap items-center gap-2 rounded-[10px] bg-white p-1">
      {SCORE_TABS.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            className={cn(
              "flex min-h-8 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold leading-[1.5] tracking-[0.02em] transition-colors",
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
  const minVal = Y_AXIS_LABELS[Y_AXIS_LABELS.length - 1]
  const maxVal = Y_AXIS_LABELS[0]
  const range = maxVal - minVal
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

  const pickValue = (p: PrepTestProgressPoint) => {
    if (tab === "raw") {
      return Math.round((p.rawScore / p.rawMax) * range + minVal)
    }
    return Math.round(((p.scaledScore - 120) / 60) * range + minVal)
  }

  const linePoints = points.map((p, i) => ({ x: xFor(i), y: yFor(pickValue(p)) }))
  const polyline = linePoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
  const areaPolygon = `${linePoints[0].x},100 ${polyline} ${linePoints[linePoints.length - 1].x},100`

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
          <div className="absolute inset-0 bottom-8 flex">
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
          <div className="absolute bottom-0 left-0 right-0 flex justify-between gap-0.5 text-[11px] leading-4 text-[#6a7282] sm:text-xs">
            {points.map((p) => (
              <span key={p.id} className="min-w-0 flex-1 truncate text-center">
                {p.test}
              </span>
            ))}
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
        className="flex h-10 items-center gap-2 rounded-xl border border-[#dfe1e7] bg-white px-3 text-sm font-semibold text-[#062357] hover:bg-[#f3f7ff]"
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
          className="absolute right-0 z-30 mt-2 min-w-[200px] overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
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
                    "flex h-10 w-full items-center rounded-xl px-3 text-sm font-medium tracking-[0.02em] transition-colors",
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

function loadBookmarks(initial: Record<string, boolean>): Record<string, boolean> {
  if (typeof window === "undefined") return initial
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return { ...initial, ...parsed }
  } catch {
    return initial
  }
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
  const initialBookmarks = useMemo(
    () => Object.fromEntries(prepRecords.map((record) => [record.id, record.bookmarked])),
    [prepRecords],
  )
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(() => loadBookmarks(initialBookmarks))

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

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks))
    } catch {
      // ignore quota / storage errors silently
    }
  }, [bookmarks])

  const records = useMemo(
    () => prepRecords.map((record) => ({ ...record, bookmarked: bookmarks[record.id] ?? record.bookmarked })),
    [bookmarks, prepRecords],
  )

  const rangedRecords = useMemo(() => filterPrepTestsByTimeRange(records, timeRange), [records, timeRange])

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
        accent: "#ae8b00",
      },
      {
        id: "avg-rc",
        label: "AVERAGE RC",
        value: formatSignedNumber(stats.averageRcMissed),
        accent: "#ff9d51",
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

  const sortedRecords = useMemo(() => {
    const out = [...rangedRecords]
    switch (historySort) {
      case "date-desc":
        out.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())
        break
      case "date-asc":
        out.sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
        break
      case "score-desc":
        out.sort((a, b) => b.scaledScore - a.scaledScore)
        break
      case "score-asc":
        out.sort((a, b) => a.scaledScore - b.scaledScore)
        break
    }
    return out
  }, [rangedRecords, historySort])

  const historyEntries = useMemo(() => getPrepTestHistoryEntries(sortedRecords), [sortedRecords])

  const visibleEntries = useMemo(
    () => (bookmarkedOnly ? historyEntries.filter((entry) => entry.bookmarked) : historyEntries),
    [historyEntries, bookmarkedOnly],
  )

  const handleToggleBookmark = useCallback(
    (id: string) => {
      const next = !(bookmarks[id] ?? false)
      setBookmarks((current) => ({ ...current, [id]: next }))
      if (practiceApi) {
        void practiceApi.updateSession({ sessionId: id, bookmarked: next })
      }
    },
    [bookmarks, practiceApi],
  )

  const handleSelectEntry = useCallback(
    (id: string) => {
      navigate(`/app/analytics/preptests/results/${encodeURIComponent(id)}`)
    },
    [navigate],
  )

  const handleOpenPractice = useCallback(
    (id: string) => {
      navigate(`/app/practice/preptest/${encodeURIComponent(id)}`)
    },
    [navigate],
  )

  return (
    <StudentMain>
        <div className="mb-6 flex flex-wrap items-center justify-end gap-4">
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>

        {loading ? (
          <p className="mb-6 text-sm text-[#666d80]">Loading drill analytics…</p>
        ) : null}

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
