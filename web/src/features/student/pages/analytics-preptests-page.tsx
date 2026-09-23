import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { StudentMain } from "@/features/student/components/student-main"
import {
  AnalyticsChartTooltip,
  AnalyticsScoreProgressPanel,
  StatTile,
  analyticsSegmentedTabClass,
  formatChartHoverDate,
} from "@/features/student/analytics/components/analytics-overview-ui"
import { HistorySortMenu } from "@/features/student/analytics/history-sort-menu"
import { sortHistoryEntries, type HistorySort } from "@/features/student/analytics/history-sort"
import { AnalyticsPrepTestHistory } from "@/features/student/components/analytics-prep-test-history"
import type { AnalyticsStat } from "@/features/student/lib/mock-analytics"
import {
  TimeRangeSegmented,
  type TimeRangeValue,
} from "@/features/student/components/time-range-filter"
import {
  computePrepTestStats,
  filterPrepTestsByTimeRange,
  formatPrepTestChartValue,
  getPrepTestHistoryEntries,
  getPrepTestProgressPoints,
  selectPrepTestChartPoints,
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
import { DEFAULT_PREPTEST_SCORE_TAB } from "@/features/student/analytics/score-chart-defaults"
import { cn } from "@/lib/utils"

const SCORE_TABS = [
  { id: "scaled", label: "Scaled score" },
  { id: "raw", label: "Raw score" },
] as const

type ScoreTab = (typeof SCORE_TABS)[number]["id"]

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
    <div className="flex flex-wrap items-center gap-1.5">
      {SCORE_TABS.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            className={analyticsSegmentedTabClass(active)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function PrepTestScoreProgressChart({ points, tab }: { points: PrepTestProgressPoint[]; tab: ScoreTab }) {
  const chartPoints = selectPrepTestChartPoints(points, tab)
  const yAxisLabels =
    tab === "raw"
      ? buildChartYAxisLabels(resolveRawScoreAxisMax(chartPoints.map((p) => p.rawMax)))
      : LSAT_SCALED_Y_AXIS_LABELS
  const minVal = yAxisLabels[yAxisLabels.length - 1] ?? 0
  const maxVal = yAxisLabels[0] ?? 1
  const range = Math.max(1, maxVal - minVal)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (chartPoints.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-[var(--greyscale-100)] text-xs text-[var(--greyscale-500)]">
        {points.length === 0
          ? "No PrepTests in the selected range."
          : tab === "scaled"
            ? "No scaled scores in this range. Switch to Raw score."
            : "No PrepTests in the selected range."}
      </div>
    )
  }

  const stepX = 100 / Math.max(1, chartPoints.length)

  const yFor = (value: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, value))
    return ((maxVal - clamped) / range) * 100
  }
  const xFor = (index: number) => stepX * index + stepX / 2

  const pickValue = (p: PrepTestProgressPoint) => (tab === "raw" ? p.rawScore : p.scaledScore)

  const linePoints = chartPoints.map((p, i) => ({ x: xFor(i), y: yFor(pickValue(p)) }))
  const polyline = linePoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
  const areaPolygon = `${linePoints[0].x},100 ${polyline} ${linePoints[linePoints.length - 1].x},100`
  const hovered = hoverIndex != null ? chartPoints[hoverIndex] : null
  const hoveredCoords = hoverIndex != null ? linePoints[hoverIndex] : null

  return (
    <div className="w-full">
      <div className="flex h-[220px] w-full items-stretch gap-3 overflow-visible">
        <div className="flex h-full flex-col justify-between py-1 pr-2 text-sm font-medium text-[var(--color-student-heading)]">
          {yAxisLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="leading-5">
              {label}
            </span>
          ))}
        </div>
        <div className="relative flex-1 overflow-visible">
          <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
            {yAxisLabels.map((label, index) => (
              <div key={`${label}-${index}`} className="h-px w-full bg-[var(--greyscale-100)]" />
            ))}
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
          <div className="absolute inset-0 overflow-visible">
            {linePoints.map((coords, i) => {
              const point = chartPoints[i]!
              const value = formatPrepTestChartValue(point, tab)
              const isActive = hoverIndex === i
              return (
                <button
                  key={point.id}
                  type="button"
                  className={cn(
                    "absolute z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)] outline-none ring-[var(--primary)]/30 transition-transform focus-visible:ring-2",
                    isActive && "scale-125 ring-2",
                  )}
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  aria-label={`${point.test}: ${value}`}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onFocus={() => setHoverIndex(i)}
                  onBlur={() => setHoverIndex(null)}
                />
              )
            })}
            {hovered && hoveredCoords ? (
              <AnalyticsChartTooltip
                title={hovered.test}
                dateLabel={formatChartHoverDate(hovered.takenAt)}
                xPct={hoveredCoords.x}
                yPct={hoveredCoords.y}
                lines={[
                  tab === "raw"
                    ? {
                        label: "Raw Score",
                        value: String(hovered.rawScore),
                        color: "var(--primary)",
                        caption: `${hovered.rawScore}/${hovered.rawMax} Correct`,
                      }
                    : {
                        label: "Regular Score",
                        value: String(hovered.scaledScore),
                        color: "var(--primary)",
                        caption: `${hovered.rawScore}/${hovered.rawMax} Correct`,
                      },
                  ...(hovered.blindReviewScaled > 0
                    ? [
                        {
                          label: "Untimed Review",
                          value: String(hovered.blindReviewScaled),
                          color: "#ff6f00",
                          caption: Number.isFinite(hovered.blindReviewPercentile)
                            ? `${Math.round(hovered.blindReviewPercentile)}th percentile`
                            : null,
                        },
                      ]
                    : []),
                ]}
              />
            ) : null}
          </div>
        </div>
      </div>
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
  const [scoreTab, setScoreTab] = useState<ScoreTab>(DEFAULT_PREPTEST_SCORE_TAB)
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [historySort, setHistorySort] = useState<HistorySort>("date-desc")

  useEffect(() => {
    if (!analyticsApi) {
      setLoading(false)
      return
    }
    setLoading(true)
    void Promise.all([
      analyticsApi.getSessions({ kind: "PREPTEST", completedOnly: true, limit: 500 }),
      analyticsApi.getSessions({ kind: "SECTION", completedOnly: true, limit: 500 }),
    ])
      .then(([prepTests, sections]) => {
        setPrepRecords(
          prepTests.sessions
            .map((s) => mapSessionToPrepTestRecord(s, sections.sessions))
            .filter((r): r is PrepTestRecord => r != null),
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
        label: "Best Score",
        value: String(stats.bestScore),
        accent: "var(--primary)",
        caption: `${ordinal(stats.bestPercentile)} percentile · Raw ${stats.bestRawScore}/${stats.bestRawMax}`,
      },
      {
        id: "average-score",
        label: "Average Score",
        value: String(stats.averageScore),
        accent: "var(--primary)",
        caption: `${ordinal(stats.averagePercentile)} percentile · Raw avg ${stats.averageRawScore}`,
      },
    ]
  }, [stats])
  const secondaryStats = useMemo((): AnalyticsStat[] => {
    if (!stats) return []
    return [
      {
        id: "avg-lr",
        label: "Logical Reasoning Average",
        value:
          stats.averageLrMissed != null ? formatSignedNumber(stats.averageLrMissed) : "—",
        accent: "var(--explanation-answered)",
      },
      {
        id: "avg-rc",
        label: "Reading Comprehension Average",
        value:
          stats.averageRcMissed != null ? formatSignedNumber(stats.averageRcMissed) : "—",
        accent: "var(--explanation-teal)",
      },
      {
        id: "best-br",
        label: "Best Untimed Review",
        value: String(stats.bestBlindReview),
        accent: "var(--destructive)",
        caption: `Average Untimed Review: ${stats.averageBlindReview}`,
      },
      {
        id: "avg-br-diff",
        label: "Average Untimed Review Diff.",
        value: formatSignedNumber(stats.averageBlindReviewDifference),
        accent: "var(--color-student-heading)",
        caption: `High: ${formatSignedNumber(stats.blindReviewDifferenceHigh)}  Low: ${formatSignedNumber(stats.blindReviewDifferenceLow)}`,
      },
    ]
  }, [stats])
  const progressPoints = useMemo(() => getPrepTestProgressPoints(rangedRecords), [rangedRecords])

  const historyEntries = useMemo(() => getPrepTestHistoryEntries(rangedRecords), [rangedRecords])

  const sortedEntries = useMemo(
    () => sortHistoryEntries(historyEntries, historySort),
    [historyEntries, historySort],
  )

  const visibleEntries = useMemo(
    () => filterBookmarkedOnly(sortedEntries, bookmarkedOnly),
    [sortedEntries, bookmarkedOnly],
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
      const record = rangedRecords.find((row) => row.id === sessionId)
      const prepTestId = record?.prepTestId?.trim() || sessionId
      navigate(prepTestHubHref(prepTestId))
    },
    [navigate, rangedRecords],
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
      <div className="flex flex-col gap-4">
        <section className="flex w-full flex-col gap-4">
          <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-b border-[var(--greyscale-100)] pb-3">
            <h1 className="!m-0 !text-lg !font-bold !leading-[1.3] text-[var(--color-student-heading)]">PrepTests</h1>
            <TimeRangeSegmented value={timeRange} onChange={setTimeRange} className="shrink-0" />
          </div>

          {stats ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(280px,420px)_1fr]">
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {headlineStats.map((stat) => (
                    <StatTile key={stat.id} stat={stat} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {secondaryStats.map((stat) => (
                    <StatTile key={stat.id} stat={stat} />
                  ))}
                </div>
              </div>
              <AnalyticsScoreProgressPanel
                title="Score Progress"
                legend={<PrepTestScoreTabs value={scoreTab} onChange={setScoreTab} />}
                chart={<PrepTestScoreProgressChart points={progressPoints} tab={scoreTab} />}
              />
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-8 text-center text-sm text-[var(--greyscale-500)]">
              No PrepTests recorded in this range. Try widening the time range.
            </p>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <HistorySortMenu
            value={historySort}
            onChange={setHistorySort}
            ariaLabel="Sort PrepTest history"
          />
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
      </div>
    </StudentMain>
  )
}

export { AnalyticsPrepTestsPage }
