import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowDownAZ, ArrowUpAZ, ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { AnalyticsPrepTestHistory } from "@/features/student/components/analytics-prep-test-history"
import {
  TimeRangeFilter,
  type TimeRangeValue,
} from "@/features/student/components/time-range-filter"
import type { AnalyticsStat } from "@/features/student/lib/mock-analytics"
import {
  buildDrillStatTiles,
  computeDrillStats,
  filterDrillsByTimeRange,
  filterDrillsByType,
  getDrillProgressPoints,
  type DrillProgressPoint,
  type DrillRecord,
  type DrillType,
} from "@/features/student/lib/mock-analytics-drills"
import {
  buildDrillTypesFromPriorities,
  mapPrepTestSessionToHistoryEntry,
  mapSessionToDrillRecord,
} from "@/features/student/analytics/map-analytics"
import { useAnalyticsApi, usePracticeApi } from "@/features/student/analytics/hooks/use-analytics-api"
import type { PrepTestHistoryEntry } from "@/features/student/lib/mock-analytics-preptests"

const Y_AXIS_LABELS = [100, 84, 68, 52, 36, 20] as const
const BOOKMARKS_STORAGE_KEY = "analytics:drills:bookmarks"

const SCORE_TABS = [
  { id: "percent", label: "% Score" },
  { id: "ptEquivalent", label: "PT equivalent score" },
] as const

type ScoreTab = (typeof SCORE_TABS)[number]["id"]

type HistorySort = "date-desc" | "date-asc" | "score-desc" | "score-asc"

const HISTORY_SORT_OPTIONS: Array<{ id: HistorySort; label: string }> = [
  { id: "date-desc", label: "Most recent" },
  { id: "date-asc", label: "Oldest first" },
  { id: "score-desc", label: "Highest score" },
  { id: "score-asc", label: "Lowest score" },
]

function DrillStatTile({ stat }: { stat: AnalyticsStat }) {
  return (
    <article className="flex h-[179px] flex-col gap-1.5 rounded-2xl bg-[#f6f8fa] p-6">
      <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">{stat.label}</p>
      <p
        className="font-extrabold leading-[1.2] whitespace-nowrap"
        style={{ color: stat.accent, fontSize: "clamp(2.25rem, 2.5vw, 3rem)" }}
      >
        {stat.value}
      </p>
    </article>
  )
}

function DrillScoreTabs({ value, onChange }: { value: ScoreTab; onChange: (next: ScoreTab) => void }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-[10px] bg-white p-1">
      {SCORE_TABS.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            className={cn(
              "flex h-8 items-center justify-center rounded-lg px-3 text-sm font-semibold leading-[1.5] tracking-[0.02em] transition-colors",
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

function DrillScoreProgressChart({ points, tab }: { points: DrillProgressPoint[]; tab: ScoreTab }) {
  const minVal = Y_AXIS_LABELS[Y_AXIS_LABELS.length - 1]
  const maxVal = Y_AXIS_LABELS[0]
  const range = maxVal - minVal
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (points.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-[#dfe1e7] text-sm text-[#666d80]">
        No drills in the selected range.
      </div>
    )
  }

  const stepX = 100 / Math.max(1, points.length)
  const yFor = (value: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, value))
    return ((maxVal - clamped) / range) * 100
  }
  const xFor = (index: number) => stepX * index + stepX / 2

  const pickValue = (p: DrillProgressPoint) => {
    if (tab === "percent") return p.scorePct
    return Math.round(((p.ptEquivalent - 120) / 60) * range + minVal)
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
              const value = tab === "percent" ? `${point.scorePct}%` : `${point.ptEquivalent}`
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
                  aria-label={`${point.label}: ${value}`}
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
                      {point.label}: {value}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between gap-0.5 text-[11px] leading-4 text-[#6a7282] sm:text-xs">
            {points.map((p) => (
              <span key={p.id} className="min-w-0 flex-1 truncate text-center">
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DrillTypeMenu({
  value,
  onChange,
  types,
}: {
  value: string | null
  onChange: (next: string | null) => void
  types: DrillType[]
}) {
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

  const activeType = value ? types.find((t) => t.id === value) ?? null : null
  const label = activeType ? activeType.label : "All drill types"

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((c) => !c)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-[52px] items-center gap-2 rounded-2xl border border-[#dfe1e7] bg-white px-3 text-base font-medium text-[#062357] hover:bg-[#f3f7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d47a1]/30"
      >
        <span className="max-w-[240px] truncate text-left">{label}</span>
        <ChevronDown className={cn("size-5 text-[#666d80] transition-transform", open ? "rotate-180" : "")} aria-hidden />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Filter by drill type"
          className="absolute right-0 z-30 mt-2 min-w-[260px] overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
        >
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={value === null}
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
              className={cn(
                "flex h-10 w-full items-center rounded-xl px-3 text-sm font-medium tracking-[0.02em] transition-colors",
                value === null ? "bg-[#f3f7ff] text-[#0d47a1]" : "text-[#062357] hover:bg-[#f6f8fa]",
              )}
            >
              All drill types
            </button>
          </li>
          {types.map((type) => {
            const active = type.id === value
            return (
              <li key={type.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(type.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium tracking-[0.02em] transition-colors",
                    active ? "bg-[#f3f7ff] text-[#0d47a1]" : "text-[#062357] hover:bg-[#f6f8fa]",
                  )}
                >
                  <span className="truncate">{type.label}</span>
                  <span className="rounded-full bg-[#f6f8fa] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#666d80]">
                    {type.section}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
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

function AnalyticsDrillsPage() {
  const navigate = useNavigate()
  const analyticsApi = useAnalyticsApi()
  const practiceApi = usePracticeApi()
  const [searchParams, setSearchParams] = useSearchParams()
  const typeFromUrl = searchParams.get("type")

  const [loading, setLoading] = useState(true)
  const [drillRecords, setDrillRecords] = useState<DrillRecord[]>([])
  const [drillTypes, setDrillTypes] = useState<DrillType[]>([])
  const [prepHistory, setPrepHistory] = useState<PrepTestHistoryEntry[]>([])

  const [scoreTab, setScoreTab] = useState<ScoreTab>("ptEquivalent")
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("all")
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [historySort, setHistorySort] = useState<HistorySort>("date-desc")
  const initialBookmarks = useMemo(
    () => Object.fromEntries(prepHistory.map((entry) => [entry.id, entry.bookmarked])),
    [prepHistory],
  )
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(() => loadBookmarks(initialBookmarks))

  useEffect(() => {
    if (!analyticsApi) {
      setLoading(false)
      return
    }
    setLoading(true)
    void Promise.all([
      analyticsApi.getSessions({ kind: "DRILL", limit: 100 }),
      analyticsApi.getSessions({ kind: "PREPTEST", limit: 50 }),
      analyticsApi.getPriorities(),
    ])
      .then(([drills, preptests, priorities]) => {
        setDrillRecords(
          drills.sessions.map(mapSessionToDrillRecord).filter((r): r is DrillRecord => r != null),
        )
        setPrepHistory(
          preptests.sessions.map(mapPrepTestSessionToHistoryEntry).filter((e): e is PrepTestHistoryEntry => e != null),
        )
        setDrillTypes(buildDrillTypesFromPriorities(priorities))
      })
      .finally(() => setLoading(false))
  }, [analyticsApi])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks))
    } catch {
      // ignore storage failures
    }
  }, [bookmarks])

  const activeType = useMemo(
    () => (typeFromUrl ? drillTypes.find((t) => t.id === typeFromUrl) ?? null : null),
    [typeFromUrl, drillTypes],
  )

  const handleSelectType = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams)
      if (next) {
        params.set("type", next)
      } else {
        params.delete("type")
      }
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const filteredRecords = useMemo(() => {
    const byType = filterDrillsByType(drillRecords, activeType?.id ?? null)
    return filterDrillsByTimeRange(byType, timeRange)
  }, [activeType, timeRange, drillRecords])

  const stats = useMemo(() => computeDrillStats(filteredRecords), [filteredRecords])
  const statTiles = useMemo(() => (stats ? buildDrillStatTiles(stats) : null), [stats])
  const progressPoints = useMemo(() => getDrillProgressPoints(filteredRecords), [filteredRecords])

  const entries = useMemo(
    () => prepHistory.map((entry) => ({ ...entry, bookmarked: bookmarks[entry.id] ?? entry.bookmarked })),
    [bookmarks, prepHistory],
  )

  const sortedEntries = useMemo(() => {
    const out = [...entries]
    switch (historySort) {
      case "date-desc":
        break
      case "date-asc":
        out.reverse()
        break
      case "score-desc":
        out.sort((a, b) => b.score / b.scoreMax - a.score / a.scoreMax)
        break
      case "score-asc":
        out.sort((a, b) => a.score / a.scoreMax - b.score / b.scoreMax)
        break
    }
    return out
  }, [entries, historySort])

  const visibleEntries = useMemo(
    () => (bookmarkedOnly ? sortedEntries.filter((entry) => entry.bookmarked) : sortedEntries),
    [sortedEntries, bookmarkedOnly],
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
    (sessionId: string) => {
      const entry = prepHistory.find((e) => e.id === sessionId)
      if (entry) {
        navigate(`/app/analytics/preptests/results/${encodeURIComponent(sessionId)}`)
        return
      }
      navigate("/app/practice/preptest")
    },
    [navigate, prepHistory],
  )

  return (
    <>
      <StudentSubnavStrip
        crumbs={[
          { label: "Analytics", href: "/app/analytics" },
          { label: "Foundations" },
          { label: "Drills" },
          ...(activeType ? [{ label: activeType.label }] : []),
        ]}
      />
      <StudentMain>
        {loading ? (
          <div className="mb-4 flex items-center gap-2 text-sm text-[#666d80]">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading drill analytics…
          </div>
        ) : null}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold leading-[1.3] text-[#062357]">Drills</h1>
            {activeType ? (
              <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#f3f7ff] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0d47a1]">
                <span>{activeType.section}</span>
                <span aria-hidden>·</span>
                <span className="normal-case tracking-normal">{activeType.label}</span>
                <button
                  type="button"
                  onClick={() => handleSelectType(null)}
                  className="ml-1 inline-flex size-4 items-center justify-center rounded-full text-[#0d47a1] hover:bg-white"
                  aria-label="Clear drill type filter"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DrillTypeMenu value={activeType?.id ?? null} onChange={handleSelectType} types={drillTypes} />
            <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
          </div>
        </div>

        <section className="mb-6 rounded-3xl border border-[#dfe1e7] bg-white p-6">
          {statTiles ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr_minmax(0,604px)]">
              <div className="grid gap-6">
                <DrillStatTile stat={statTiles[0]} />
                <DrillStatTile stat={statTiles[2]} />
              </div>
              <div className="grid gap-6">
                <DrillStatTile stat={statTiles[1]} />
                <DrillStatTile stat={statTiles[3]} />
              </div>

              <div className="flex h-full min-h-[382px] flex-col gap-[18px] rounded-2xl bg-[#f6f8fa] p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
                    SCORE PROGRESS
                  </h2>
                  <DrillScoreTabs value={scoreTab} onChange={setScoreTab} />
                </div>
                <DrillScoreProgressChart points={progressPoints} tab={scoreTab} />
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[#dfe1e7] bg-[#f9fbfc] px-6 py-8 text-center text-sm text-[#666d80]">
              No drills match the current filters. Try widening the time range or clearing the drill type.
            </p>
          )}
        </section>

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
    </>
  )
}

export { AnalyticsDrillsPage }
