import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { AnalyticsPrepTestHistory } from "@/features/student/components/analytics-prep-test-history"
import { HistorySortMenu } from "@/features/student/analytics/history-sort-menu"
import { sortHistoryEntries, type HistorySort } from "@/features/student/analytics/history-sort"
import {
  TimeRangeFilter,
  type TimeRangeValue,
} from "@/features/student/components/time-range-filter"
import {
  AnalyticsScoreProgressPanel,
  AnalyticsStatsGrid,
} from "@/features/student/analytics/components/analytics-overview-ui"
import {
  buildDrillStatTiles,
  computeDrillStats,
  filterDrillsBySection,
  filterDrillsByTimeRange,
  filterDrillsByType,
  getDrillProgressPoints,
  type DrillProgressPoint,
  type DrillRecord,
  type DrillSectionFilter,
  type DrillType,
} from "@/features/student/lib/mock-analytics-drills"
import { practiceSessionResultsPath } from "@/features/student/analytics/analytics-results-paths"
import {
  buildDrillTypesFromPriorities,
  mapDrillSessionToHistoryEntry,
  mapSessionToDrillRecord,
} from "@/features/student/analytics/map-analytics"
import {
  filterBookmarkedOnly,
  persistSessionBookmark,
  sessionBookmarkState,
  withSessionBookmark,
} from "@/features/student/analytics/session-bookmarks"
import {
  analyticsSectionParamValue,
  matchesAnalyticsSectionFilter,
  parseAnalyticsSectionParam,
} from "@/features/student/analytics/section-filter"
import { useAnalyticsApi, usePracticeApi } from "@/features/student/analytics/hooks/use-analytics-api"
import {
  LSAT_SCALED_Y_AXIS_LABELS,
  PERCENT_Y_AXIS_LABELS,
} from "@/features/student/analytics/chart-y-axis"
import { drillFilterPillClass } from "@/features/student/components/drill-filter-pill"
import type { PrepTestHistoryEntry } from "@/features/student/lib/mock-analytics-preptests"

const SCORE_TABS = [
  { id: "percent", label: "% Score" },
  { id: "ptEquivalent", label: "PT equivalent score" },
] as const

type ScoreTab = (typeof SCORE_TABS)[number]["id"]

function DrillScoreTabs({ value, onChange }: { value: ScoreTab; onChange: (next: ScoreTab) => void }) {
  return (
    <div className="flex h-8 flex-wrap items-center gap-1.5 rounded-[10px] bg-[var(--greyscale-0)] p-0.5">
      {SCORE_TABS.map((tab) => {
        const active = value === tab.id
        if (tab.id === "percent") {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-pressed={active}
              className={cn(
                "flex min-h-7 items-center justify-center gap-1.5 rounded-[10px] px-2.5 py-1 text-xs font-semibold leading-[1.4] tracking-[0.02em] transition-colors",
                active ? "bg-[var(--primary)] text-white" : "text-[var(--greyscale-500)] hover:bg-[var(--primary-0)]",
              )}
            >
              <span
                className={cn("size-2.5 rounded-full", active ? "bg-white" : "bg-[var(--greyscale-400)]")}
                aria-hidden
              />
              {tab.label}
            </button>
          )
        }
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            className={cn(
              "rounded-[8px] px-2.5 py-1 text-xs font-semibold leading-[1.4] tracking-[0.02em] transition-colors hover:rounded-[8px] active:rounded-[8px] focus-visible:rounded-[8px]",
              active ? "bg-[var(--primary)] text-white" : "border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--greyscale-500)] hover:bg-[var(--primary-0)]",
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
  const yAxisLabels = tab === "percent" ? PERCENT_Y_AXIS_LABELS : LSAT_SCALED_Y_AXIS_LABELS
  const minVal = yAxisLabels[yAxisLabels.length - 1] ?? 0
  const maxVal = yAxisLabels[0] ?? 1
  const range = Math.max(1, maxVal - minVal)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const tickCount = Math.max(2, yAxisLabels.length)

  if (points.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-[var(--greyscale-100)] text-xs text-[var(--greyscale-500)]">
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
  const tickTopPct = (index: number) => (index / (tickCount - 1)) * 100

  const pickValue = (p: DrillProgressPoint) => (tab === "percent" ? p.scorePct : p.ptEquivalent)

  const linePoints = points.map((p, i) => ({ x: xFor(i), y: yFor(pickValue(p)) }))
  const polyline = linePoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
  const areaPolygon = `${linePoints[0].x},100 ${polyline} ${linePoints[linePoints.length - 1].x},100`

  return (
    <div className="w-full">
      <div className="flex h-[220px] w-full items-stretch gap-3">
        <div className="relative w-10 shrink-0 pr-2 text-sm font-medium text-[var(--color-student-heading)]">
          {yAxisLabels.map((label, index) => {
            const isFirst = index === 0
            const isLast = index === yAxisLabels.length - 1
            return (
              <span
                key={`${label}-${index}`}
                className={cn(
                  "absolute right-2 leading-none",
                  isFirst ? "translate-y-0" : isLast ? "-translate-y-full" : "-translate-y-1/2",
                )}
                style={{ top: `${tickTopPct(index)}%` }}
              >
                {tab === "percent" ? `${label}%` : label}
              </span>
            )
          })}
        </div>
        <div className="relative min-w-0 flex-1 overflow-visible">
          <div className="absolute inset-0" aria-hidden>
            {yAxisLabels.map((label, index) => {
              const isFirst = index === 0
              const isLast = index === yAxisLabels.length - 1
              return (
                <div
                  key={`${label}-${index}`}
                  className={cn(
                    "absolute left-0 right-0 h-px bg-[var(--greyscale-100)]",
                    isFirst ? "" : isLast ? "-translate-y-full" : "-translate-y-1/2",
                  )}
                  style={{ top: `${tickTopPct(index)}%` }}
                />
              )
            })}
          </div>
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <polygon points={areaPolygon} fill="var(--primary)" fillOpacity="0.08" />
            <polyline
              points={polyline}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute inset-0 flex">
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
                      "absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--destructive)] transition-transform",
                      isActive ? "scale-150 ring-2 ring-[var(--destructive)]/30" : "",
                    )}
                    style={{ left: "50%", top: `${linePoints[i].y}%` }}
                    aria-hidden
                  />
                  {isActive ? (
                    <span
                      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[var(--color-student-heading)] px-2 py-1 text-xs font-semibold text-white shadow-lg"
                      style={{ left: "50%", top: `calc(${linePoints[i].y}% - 8px)` }}
                    >
                      {point.label}: {value}
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
        className="flex h-8 items-center gap-1.5 rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-2.5 text-xs font-medium text-[var(--color-student-heading)] hover:bg-[var(--primary-0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30"
      >
        <span className="max-w-[240px] truncate text-left">{label}</span>
        <ChevronDown className={cn("size-5 text-[var(--greyscale-500)] transition-transform", open ? "rotate-180" : "")} aria-hidden />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Filter by drill type"
          className="absolute right-0 z-30 mt-2 min-w-[260px] overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
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
                "flex h-10 w-full items-center rounded-[16px] px-3 text-sm font-medium tracking-[0.02em] transition-colors",
                value === null ? "bg-[var(--primary-0)] text-[var(--primary)]" : "text-[var(--color-student-heading)] hover:bg-[var(--greyscale-25)]",
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
                    "flex h-10 w-full items-center justify-between gap-3 rounded-[16px] px-3 text-sm font-medium tracking-[0.02em] transition-colors",
                    active ? "bg-[var(--primary-0)] text-[var(--primary)]" : "text-[var(--color-student-heading)] hover:bg-[var(--greyscale-25)]",
                  )}
                >
                  <span className="truncate">{type.label}</span>
                  <span className="rounded-full bg-[var(--greyscale-25)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--greyscale-500)]">
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

function AnalyticsDrillsPage() {
  const navigate = useNavigate()
  const analyticsApi = useAnalyticsApi()
  const practiceApi = usePracticeApi()
  const [searchParams, setSearchParams] = useSearchParams()
  const typeFromUrl = searchParams.get("type")
  const sectionFilter = parseAnalyticsSectionParam(searchParams.get("section"))

  const [loading, setLoading] = useState(true)
  const [drillRecords, setDrillRecords] = useState<DrillRecord[]>([])
  const [drillTypes, setDrillTypes] = useState<DrillType[]>([])
  const [drillHistory, setDrillHistory] = useState<PrepTestHistoryEntry[]>([])

  const [scoreTab, setScoreTab] = useState<ScoreTab>("ptEquivalent")
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("all")
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [historySort, setHistorySort] = useState<HistorySort>("date-desc")

  useEffect(() => {
    if (!analyticsApi) {
      setLoading(false)
      return
    }
    setLoading(true)
    void Promise.all([
      analyticsApi.getSessions({ kind: "DRILL", completedOnly: true, limit: 500 }),
      analyticsApi.getPriorities(),
    ])
      .then(([drills, priorities]) => {
        setDrillRecords(
          drills.sessions.map(mapSessionToDrillRecord).filter((r): r is DrillRecord => r != null),
        )
        setDrillHistory(
          drills.sessions
            .map(mapDrillSessionToHistoryEntry)
            .filter((e): e is PrepTestHistoryEntry => e != null),
        )
        setDrillTypes(buildDrillTypesFromPriorities(priorities))
      })
      .finally(() => setLoading(false))
  }, [analyticsApi])

  const typesForSection = useMemo(
    () =>
      sectionFilter === "all"
        ? drillTypes
        : drillTypes.filter((t) => t.section === sectionFilter),
    [drillTypes, sectionFilter],
  )

  const activeType = useMemo(
    () => (typeFromUrl ? typesForSection.find((t) => t.id === typeFromUrl) ?? null : null),
    [typeFromUrl, typesForSection],
  )

  const updateSearchParams = useCallback(
    (next: { type?: string | null; section?: DrillSectionFilter }) => {
      const params = new URLSearchParams(searchParams)
      if ("type" in next) {
        if (next.type) params.set("type", next.type)
        else params.delete("type")
      }
      if ("section" in next && next.section != null) {
        const sectionValue = analyticsSectionParamValue(next.section)
        if (sectionValue) params.set("section", sectionValue)
        else params.delete("section")
      }
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const handleSelectSection = useCallback(
    (next: DrillSectionFilter) => {
      const typeStillValid =
        typeFromUrl &&
        drillTypes.some((t) => t.id === typeFromUrl && matchesAnalyticsSectionFilter(t.section, next))
      updateSearchParams({
        section: next,
        type: typeStillValid ? typeFromUrl : null,
      })
    },
    [drillTypes, typeFromUrl, updateSearchParams],
  )

  const handleSelectType = useCallback(
    (next: string | null) => {
      updateSearchParams({ type: next })
    },
    [updateSearchParams],
  )

  const filteredRecords = useMemo(() => {
    const bySection = filterDrillsBySection(drillRecords, sectionFilter)
    const byType = filterDrillsByType(bySection, activeType?.id ?? null)
    return filterDrillsByTimeRange(byType, timeRange)
  }, [activeType, drillRecords, sectionFilter, timeRange])

  const stats = useMemo(() => computeDrillStats(filteredRecords), [filteredRecords])
  const statTiles = useMemo(() => (stats ? buildDrillStatTiles(stats) : null), [stats])
  const progressPoints = useMemo(() => getDrillProgressPoints(filteredRecords), [filteredRecords])

  const filteredIds = useMemo(
    () => new Set(filteredRecords.map((record) => record.id)),
    [filteredRecords],
  )

  const entries = useMemo(
    () => drillHistory.filter((entry) => filteredIds.has(entry.id)),
    [drillHistory, filteredIds],
  )

  const sortedEntries = useMemo(
    () => sortHistoryEntries(entries, historySort),
    [entries, historySort],
  )

  const visibleEntries = useMemo(
    () => filterBookmarkedOnly(sortedEntries, bookmarkedOnly),
    [sortedEntries, bookmarkedOnly],
  )

  const handleToggleBookmark = useCallback(
    (id: string) => {
      const previous = sessionBookmarkState(drillHistory, id)
      const next = !previous
      setDrillHistory((current) => withSessionBookmark(current, id, next))
      void persistSessionBookmark({
        sessionId: id,
        bookmarked: next,
        practiceApi,
        onFailure: () => setDrillHistory((current) => withSessionBookmark(current, id, previous)),
      })
    },
    [drillHistory, practiceApi],
  )

  const handleSelectEntry = useCallback(
    (id: string) => {
      navigate(practiceSessionResultsPath(id))
    },
    [navigate],
  )

  if (loading) {
    return (
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading drill analytics…" />
      </StudentMain>
    )
  }

  return (
    <StudentMain>
      <section className="mb-4 flex flex-col gap-3 rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="!m-0 !text-lg !font-bold !leading-[1.3] text-[var(--color-student-heading)]">Drills</h1>
            {activeType ? (
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--primary-0)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                <span>{activeType.section}</span>
                <span aria-hidden>·</span>
                <span className="normal-case tracking-normal">{activeType.label}</span>
                <button
                  type="button"
                  onClick={() => handleSelectType(null)}
                  className="ml-1 inline-flex size-4 items-center justify-center rounded-full text-[var(--primary)] hover:bg-[var(--greyscale-0)]"
                  aria-label="Clear drill type filter"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by section">
              <button
                type="button"
                onClick={() => handleSelectSection("all")}
                className={drillFilterPillClass(sectionFilter === "all")}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleSelectSection("LR")}
                className={drillFilterPillClass(sectionFilter === "LR")}
              >
                LR
              </button>
              <button
                type="button"
                onClick={() => handleSelectSection("RC")}
                className={drillFilterPillClass(sectionFilter === "RC")}
              >
                RC
              </button>
            </div>
            <DrillTypeMenu value={activeType?.id ?? null} onChange={handleSelectType} types={typesForSection} />
            <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
          </div>
        </div>

        {statTiles ? (
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,320px)_1fr]">
            <AnalyticsStatsGrid stats={statTiles} />
            <AnalyticsScoreProgressPanel
              title="Score progress"
              legend={<DrillScoreTabs value={scoreTab} onChange={setScoreTab} />}
              chart={<DrillScoreProgressChart points={progressPoints} tab={scoreTab} />}
            />
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-6 py-8 text-center text-sm text-[var(--greyscale-500)]">
            No drills match the current filters. Try widening the time range or clearing the section / drill type.
          </p>
        )}
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <HistorySortMenu
          value={historySort}
          onChange={setHistorySort}
          ariaLabel="Sort drill history"
        />
      </div>

      <AnalyticsPrepTestHistory
        title="Drill History"
        emptyNoun="drills"
        visibleEntries={visibleEntries}
        bookmarkedOnly={bookmarkedOnly}
        onBookmarkedOnlyChange={setBookmarkedOnly}
        sectionFilter={sectionFilter}
        onSectionFilterChange={handleSelectSection}
        onToggleBookmark={handleToggleBookmark}
        onSelectEntry={handleSelectEntry}
      />
    </StudentMain>
  )
}

export { AnalyticsDrillsPage }
