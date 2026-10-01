import { useMemo, useState, type ReactNode } from "react"
import { Bookmark, Check } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import {
  AnalyticsChartTooltip,
  analyticsSegmentedTabClass,
  formatChartHoverDate,
} from "@/features/student/analytics/components/analytics-overview-ui"
import {
  DEFAULT_GOAL_SCORE,
  buildPrepTestInsightLogRows,
  rollingAverageSeries,
  sectionTone,
  sortInsightLogRows,
  type PrepTestInsightLogRow,
  type PrepTestInsightStats,
} from "@/features/student/analytics/prep-test-insights"
import { checkedFromToggleEvent } from "@/features/student/analytics/session-bookmarks"
import {
  LSAT_SCALED_Y_AXIS_LABELS,
  buildChartYAxisLabels,
  resolveRawScoreAxisMax,
} from "@/features/student/analytics/chart-y-axis"
import type { PrepTestProgressPoint } from "@/features/student/lib/mock-analytics-preptests"
import type { PrepTestSectionAccuracy } from "@/features/student/lib/mock-analytics-preptests"
import { cn } from "@/lib/utils"

const MOMENTUM_UP_ICON = "/figma/preptest-insights/momentum-up.svg"
const BOOKMARK_OUTLINE_ICON = "/figma/preptest-insights/bookmark-outline.svg"

/** Figma `21291:49774` log-row tokens */
const LOG_HEADING = "#0e1b33"
const LOG_MUTED = "#5a6782"
const LOG_BORDER = "#edf1f7"
const SECTION_TRACK = "#eef1f6"
const SECTION_STRONG = "#0b3d91"
const SECTION_WEAK = "#c2560c"
const MOMENTUM_POSITIVE_BG = "#dff3e6"
const MOMENTUM_POSITIVE_FG = "#166534"

const ACCENT_ORANGE = "#c2560c"
const ACCENT_GREEN = "var(--explanation-answered)"
const TARGET_GREEN = "#1f7a45"
const TRAJECTORY_LINE = "#0b3d91"
const TRAJECTORY_GRID = "#e6ebf3"
const TRAJECTORY_AREA_OPACITY = 0.07

export type TrajectoryTab = "scaled" | "raw"
export type InsightHistorySort = "recent" | "momentum"

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

/** Figma uses a true minus (U+2212) for negative deltas. */
export function formatInsightSigned(value: number, digits = 1): string {
  const abs = Math.abs(value)
  const body = Number.isInteger(abs) && digits === 0 ? String(abs) : abs.toFixed(digits)
  if (value > 0) return `+${body}`
  if (value < 0) return `\u2212${body}`
  return digits === 0 ? "0" : (0).toFixed(digits)
}

function InsightStatCard({
  label,
  value,
  valueColor,
  footer,
}: {
  label: string
  value: string
  valueColor?: string
  footer: ReactNode
}) {
  return (
    <article className="flex min-h-[149px] min-w-0 flex-col justify-between rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6 shadow-[0px_1px_2px_rgba(13,13,18,0.04)]">
      <div className="flex flex-col gap-1.5">
        <p className="m-0 text-sm font-semibold leading-[1.5] tracking-[0.01em] text-[var(--color-student-heading)]">
          {label}
        </p>
        <p
          className="m-0 text-[36px] font-extrabold leading-none tracking-tight"
          style={{ color: valueColor ?? "var(--color-student-heading)" }}
        >
          {value}
        </p>
      </div>
      <div className="mt-3 flex min-h-[30px] flex-wrap items-center gap-x-2 gap-y-1">{footer}</div>
    </article>
  )
}

export function PrepTestInsightStatsRow({ stats }: { stats: PrepTestInsightStats }) {
  const targetGapColor =
    stats.targetGap == null
      ? "var(--color-student-heading)"
      : stats.targetGap < 0
        ? ACCENT_ORANGE
        : stats.targetGap > 0
          ? ACCENT_GREEN
          : "var(--color-student-heading)"
  const dropoffColor =
    stats.sectionDropoffPct == null
      ? "var(--color-student-heading)"
      : stats.sectionDropoffPct < 0
        ? ACCENT_ORANGE
        : stats.sectionDropoffPct > 0
          ? ACCENT_GREEN
          : "var(--color-student-heading)"

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <InsightStatCard
        label="Peak Score"
        value={String(stats.peakScore)}
        valueColor="var(--color-student-heading)"
        footer={
          <>
            <span className="inline-flex items-center rounded-full bg-[var(--primary-25)] px-2.5 py-0.5 text-[11px] font-semibold leading-[1.35] text-[var(--primary)]">
              {ordinal(stats.peakPercentile)} percentile
            </span>
            <span className="text-[11px] font-medium leading-[1.35] text-[var(--greyscale-500)]">
              all-time high
            </span>
          </>
        }
      />
      <InsightStatCard
        label="Target Gap"
        value={stats.targetGap == null ? "—" : formatInsightSigned(stats.targetGap, 1)}
        valueColor={targetGapColor}
        footer={
          <span className="text-[11px] font-medium leading-[1.35] text-[var(--greyscale-500)]">
            {stats.averageScore != null && stats.goalScore != null
              ? `Average ${stats.averageScore} vs. target ${stats.goalScore}`
              : "Set a target score in Overview"}
          </span>
        }
      />
      <InsightStatCard
        label="Score Variance"
        value={stats.variancePts == null ? "—" : `${stats.variancePts} pts`}
        valueColor="var(--color-student-heading)"
        footer={
          <span className="text-[11px] font-medium leading-[1.35] text-[var(--greyscale-500)]">
            {stats.varianceLow != null && stats.varianceHigh != null
              ? `${stats.varianceLow} to ${stats.varianceHigh} across last 5 tests`
              : "Need more scaled PrepTests"}
          </span>
        }
      />
      <InsightStatCard
        label="Section Drop-off"
        value={
          stats.sectionDropoffPct == null ? "—" : `${formatInsightSigned(stats.sectionDropoffPct, 1)}%`
        }
        valueColor={dropoffColor}
        footer={
          <span className="text-[11px] font-medium leading-[1.35] text-[var(--greyscale-500)]">
            Section 4 accuracy vs. S1–S3
          </span>
        }
      />
    </div>
  )
}

function TrajectoryTabs({
  value,
  onChange,
}: {
  value: TrajectoryTab
  onChange: (next: TrajectoryTab) => void
}) {
  const tabs: Array<{ id: TrajectoryTab; label: string }> = [
    { id: "scaled", label: "120–180 Scale" },
    { id: "raw", label: "Total Correct" },
  ]
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] p-1">
      {tabs.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            className={cn(
              "flex h-8 items-center justify-center rounded-[10px] px-3.5 text-[11px] font-semibold leading-none tracking-[0.02em] transition-colors",
              active
                ? "bg-[var(--primary)] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
                : "text-[var(--color-student-heading)] hover:bg-[var(--greyscale-0)]",
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function ExamTrajectoryChart({
  points,
  tab,
  goalScore,
}: {
  points: PrepTestProgressPoint[]
  tab: TrajectoryTab
  goalScore: number | null
}) {
  const chartPoints =
    tab === "scaled" ? points.filter((p) => p.hasScaledScore) : points
  const yAxisLabels =
    tab === "raw"
      ? buildChartYAxisLabels(resolveRawScoreAxisMax(chartPoints.map((p) => p.rawMax)))
      : LSAT_SCALED_Y_AXIS_LABELS
  const minVal = yAxisLabels[yAxisLabels.length - 1] ?? 0
  const maxVal = yAxisLabels[0] ?? 1
  const range = Math.max(1, maxVal - minVal)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const values = chartPoints.map((p) => (tab === "raw" ? p.rawScore : p.scaledScore))
  const rolling = rollingAverageSeries(values)
  const target = tab === "scaled" ? (goalScore ?? DEFAULT_GOAL_SCORE) : null

  if (chartPoints.length === 0) {
    return (
      <div className="flex h-[284px] items-center justify-center rounded-xl border border-dashed border-[var(--greyscale-100)] text-xs text-[var(--greyscale-500)]">
        {points.length === 0
          ? "No PrepTests in the selected range."
          : "No scaled scores in this range. Switch to Total Correct."}
      </div>
    )
  }

  const yFor = (value: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, value))
    return ((maxVal - clamped) / range) * 100
  }
  /** Figma places first/last points at the plot edges. */
  const xFor = (index: number) =>
    chartPoints.length <= 1 ? 50 : (index / (chartPoints.length - 1)) * 100

  const linePoints = values.map((value, i) => ({ x: xFor(i), y: yFor(value) }))
  const rollingPoints = rolling.map((value, i) =>
    value == null ? null : { x: xFor(i), y: yFor(value) },
  )
  const polyline = linePoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
  const areaPolygon =
    linePoints.length > 0
      ? `${linePoints[0]!.x.toFixed(2)},100 ${polyline} ${linePoints[linePoints.length - 1]!.x.toFixed(2)},100`
      : ""
  const rollingPolyline = rollingPoints
    .filter((p): p is { x: number; y: number } => p != null)
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ")
  const targetY = target != null ? yFor(target) : null
  const hovered = hoverIndex != null ? chartPoints[hoverIndex] : null
  const hoveredCoords = hoverIndex != null ? linePoints[hoverIndex] : null

  return (
    <div className="w-full" data-node-id="21291:49704">
      <div className="flex h-[284px] w-full items-stretch gap-3 overflow-visible">
        <div
          className="flex h-full flex-col justify-between py-0 pr-2 text-sm font-medium leading-5"
          style={{ color: LOG_HEADING }}
        >
          {yAxisLabels.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1 overflow-visible">
          <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
            {yAxisLabels.map((label, index) => (
              <div
                key={`${label}-${index}`}
                className="h-px w-full"
                style={{ background: TRAJECTORY_GRID }}
              />
            ))}
          </div>
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {areaPolygon ? (
              <polygon
                points={areaPolygon}
                fill={TRAJECTORY_LINE}
                fillOpacity={TRAJECTORY_AREA_OPACITY}
              />
            ) : null}
            {targetY != null ? (
              <line
                x1="0"
                y1={targetY}
                x2="100"
                y2={targetY}
                stroke={TARGET_GREEN}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="2 5"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {rollingPolyline ? (
              <polyline
                points={rollingPolyline}
                fill="none"
                stroke={ACCENT_ORANGE}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeDasharray="6 5"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <polyline
              points={polyline}
              fill="none"
              stroke={TRAJECTORY_LINE}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute inset-0 overflow-visible">
            {linePoints.map((coords, i) => {
              const point = chartPoints[i]!
              const isActive = hoverIndex === i
              return (
                <button
                  key={point.id}
                  type="button"
                  className={cn(
                    "absolute z-10 size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] bg-white outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30",
                    isActive && "scale-125",
                  )}
                  style={{
                    left: `${coords.x}%`,
                    top: `${coords.y}%`,
                    borderColor: TRAJECTORY_LINE,
                  }}
                  aria-label={`${point.test}: ${tab === "raw" ? point.rawScore : point.scaledScore}`}
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
                  {
                    label: tab === "raw" ? "Total Correct" : "Scaled Score",
                    value: String(tab === "raw" ? hovered.rawScore : hovered.scaledScore),
                    color: TRAJECTORY_LINE,
                    caption: `${hovered.rawScore}/${hovered.rawMax} Correct`,
                  },
                  ...(rolling[hoverIndex!] != null
                    ? [
                        {
                          label: "5-test rolling avg",
                          value: String(rolling[hoverIndex!]),
                          color: ACCENT_ORANGE,
                          caption: null,
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

export function PrepTestExamTrajectoryPanel({
  points,
  tab,
  onTabChange,
  goalScore,
}: {
  points: PrepTestProgressPoint[]
  tab: TrajectoryTab
  onTabChange: (next: TrajectoryTab) => void
  goalScore: number | null
}) {
  const targetLabel = `Target ${goalScore ?? DEFAULT_GOAL_SCORE}`
  return (
    <section className="rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6 shadow-[0px_1px_2px_rgba(13,13,18,0.04)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="!m-0 !text-base !font-bold !leading-[1.4] text-[var(--color-student-heading)]">
            PrepTest Trajectory
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-[var(--greyscale-500)]">
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-0.5 w-[18px] rounded-full"
                style={{ background: TRAJECTORY_LINE }}
                aria-hidden
              />
              Each PrepTest
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-0 w-[18px] border-t-2 border-dashed"
                style={{ borderColor: ACCENT_ORANGE }}
                aria-hidden
              />
              5-test rolling average
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-0 w-[18px] border-t-2 border-dotted"
                style={{ borderColor: TARGET_GREEN }}
                aria-hidden
              />
              {targetLabel}
            </span>
          </div>
        </div>
        <TrajectoryTabs value={tab} onChange={onTabChange} />
      </div>
      <ExamTrajectoryChart points={points} tab={tab} goalScore={goalScore} />
    </section>
  )
}

function SectionAccuracyBars({ sections }: { sections: PrepTestSectionAccuracy[] }) {
  if (sections.length === 0) {
    return (
      <div className="flex h-10 w-[252px] items-center">
        <span className="text-xs text-[var(--greyscale-400)]">—</span>
      </div>
    )
  }
  return (
    <div
      className="flex h-10 w-[252px] shrink-0 items-end gap-2"
      aria-label="Section accuracy S1 to S4"
    >
      {sections.map((section) => {
        const pct = section.max > 0 ? Math.max(0, Math.min(100, (section.correct / section.max) * 100)) : 0
        const fillPx = Math.max(4, Math.round((pct / 100) * 28))
        const tone = sectionTone(section, sections)
        const fill = tone === "weak" ? SECTION_WEAK : SECTION_STRONG
        return (
          <div
            key={section.number}
            className="flex w-11 shrink-0 flex-col items-center gap-[3px]"
            title={`Section ${section.number}: ${section.correct} of ${section.max}`}
          >
            <div
              className="flex size-7 shrink-0 items-end overflow-hidden rounded-[6px]"
              style={{ background: SECTION_TRACK }}
            >
              <div className="w-7 shrink-0" style={{ height: fillPx, background: fill }} />
            </div>
            <span className="whitespace-nowrap text-[11px] font-normal leading-none" style={{ color: LOG_MUTED }}>
              S{section.number}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function MomentumBadge({ value }: { value: number | null }) {
  if (value == null || value === 0) {
    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold leading-[1.5] tracking-[0.28px]"
        style={{ background: SECTION_TRACK, color: LOG_MUTED }}
      >
        0.0
      </span>
    )
  }
  const positive = value > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold leading-[1.5] tracking-[0.28px]",
        !positive && "bg-[var(--blind-review-badge-bg)] text-[var(--blind-review-accent)]",
      )}
      style={positive ? { background: MOMENTUM_POSITIVE_BG, color: MOMENTUM_POSITIVE_FG } : undefined}
    >
      {positive ? (
        <span className="inline-flex size-3 shrink-0 items-center justify-center overflow-hidden" aria-hidden>
          <img src={MOMENTUM_UP_ICON} alt="" className="size-[8.5px]" width={8.5} height={8.5} />
        </span>
      ) : null}
      {formatInsightSigned(value, 1)}
    </span>
  )
}

/** Figma `21291:49774` — Full Test Log row */
function InsightLogRow({
  row,
  onSelect,
  onToggleBookmark,
}: {
  row: PrepTestInsightLogRow
  onSelect: (id: string) => void
  onToggleBookmark: (id: string) => void
}) {
  return (
    <div
      className="flex items-center gap-4 border-b border-solid px-7 py-[15px] last:border-b-0"
      style={{ borderColor: LOG_BORDER }}
    >
      <div className="flex h-[38px] w-[210px] shrink-0 flex-col items-start gap-0.5">
        <button
          type="button"
          onClick={() => onSelect(row.id)}
          className="m-0 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[var(--primary)] hover:underline"
        >
          {row.testLabel}
        </button>
        <p
          className="m-0 text-xs font-normal leading-[1.5] tracking-[0.24px]"
          style={{ color: LOG_MUTED }}
        >
          {row.dateLabel}
        </p>
      </div>

      <div className="flex h-12 w-[134px] shrink-0 flex-col items-start gap-0.5">
        <p
          className="m-0 text-xl font-bold leading-[1.35]"
          style={{ color: LOG_HEADING }}
        >
          {row.score != null ? row.score : "—"}
        </p>
        <p
          className="m-0 text-xs font-normal leading-[1.5] tracking-[0.24px]"
          style={{ color: LOG_MUTED }}
        >
          {row.rawScore} / {row.rawMax} correct
        </p>
      </div>

      <div className="flex h-[31px] w-[152px] shrink-0 items-center">
        <MomentumBadge value={row.momentum} />
      </div>

      <SectionAccuracyBars sections={row.sections} />

      <div className="flex h-[19px] w-[144px] shrink-0 items-center">
        <p
          className="m-0 text-sm font-semibold leading-[1.5] tracking-[0.28px]"
          style={{ color: LOG_HEADING }}
        >
          {row.untimedDelta == null
            ? "—"
            : `${formatInsightSigned(Math.round(row.untimedDelta), 0)} when untimed`}
        </p>
      </div>

      <button
        type="button"
        aria-label={row.bookmarked ? "Remove bookmark" : "Bookmark test"}
        aria-pressed={row.bookmarked}
        onClick={() => onToggleBookmark(row.id)}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] hover:bg-[var(--primary-0)]"
      >
        {row.bookmarked ? (
          <Bookmark className="size-[18px] fill-[var(--primary)] text-[var(--primary)]" aria-hidden />
        ) : (
          <span className="inline-flex size-[18px] items-center justify-center overflow-hidden" aria-hidden>
            <img src={BOOKMARK_OUTLINE_ICON} alt="" className="h-[15px] w-3" width={12} height={15} />
          </span>
        )}
      </button>
    </div>
  )
}

export function PrepTestFullTestLog({
  rows,
  bookmarkedOnly,
  onBookmarkedOnlyChange,
  sort,
  onSortChange,
  onSelectEntry,
  onToggleBookmark,
  emptyNoun = "PrepTests",
}: {
  rows: PrepTestInsightLogRow[]
  bookmarkedOnly: boolean
  onBookmarkedOnlyChange: (next: boolean) => void
  sort: InsightHistorySort
  onSortChange: (next: InsightHistorySort) => void
  onSelectEntry: (id: string) => void
  onToggleBookmark: (id: string) => void
  emptyNoun?: string
}) {
  const sortOptions: Array<{ id: InsightHistorySort; label: string }> = [
    { id: "recent", label: "Most recent" },
    { id: "momentum", label: "Strongest momentum" },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-b border-[var(--greyscale-100)] pb-3">
        <h2 className="!m-0 !text-lg !font-bold !leading-[1.3] text-[var(--color-student-heading)]">History</h2>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Sort history">
          {sortOptions.map((option) => {
            const active = sort === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSortChange(option.id)}
                aria-pressed={active}
                className={analyticsSegmentedTabClass(active)}
              >
                {active ? (
                  <span
                    className="mr-1 inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-white/20"
                    aria-hidden
                  >
                    <Check className="size-2.5 stroke-[3]" />
                  </span>
                ) : null}
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <section className="overflow-hidden rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_2px_rgba(13,13,18,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--greyscale-100)] px-5 py-4">
          <div>
            <h3 className="!m-0 !text-base !font-bold !leading-[1.4] text-[var(--color-student-heading)]">
              Full Test Log
            </h3>
            <p className="mt-1.5 m-0 text-xs font-medium leading-[1.5] text-[var(--greyscale-500)]">
              Momentum compares each test with your average over the 5 tests before it.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-student-heading)]">
            Bookmarked only
            <Switch
              size="sm"
              checked={bookmarkedOnly}
              onChange={(event) => onBookmarkedOnlyChange(checkedFromToggleEvent(event))}
              aria-label="Show bookmarked PrepTests only"
            />
          </label>
        </div>

        <div
          className="hidden items-center gap-4 border-b border-solid px-7 py-3 text-xs font-semibold leading-none md:flex"
          style={{ borderColor: LOG_BORDER, color: LOG_MUTED }}
        >
          <span className="w-[210px] shrink-0">Test</span>
          <span className="w-[134px] shrink-0">Score</span>
          <span className="w-[152px] shrink-0">Momentum</span>
          <span className="w-[252px] shrink-0">Section accuracy, S1 → S4</span>
          <span className="w-[144px] shrink-0">Untimed review</span>
          <span className="w-10 shrink-0 text-center">Bookmark</span>
        </div>

        {rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-[var(--greyscale-500)]">
            No {emptyNoun} in this range{bookmarkedOnly ? " match the bookmark filter" : ""}.
          </p>
        ) : (
          <div className="max-h-[440px] overflow-auto">
            {rows.map((row) => (
              <InsightLogRow
                key={row.id}
                row={row}
                onSelect={onSelectEntry}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export function usePrepTestInsightLogRows(
  records: Parameters<typeof buildPrepTestInsightLogRows>[0],
  sort: InsightHistorySort,
  bookmarkedOnly: boolean,
) {
  return useMemo(() => {
    const rows = buildPrepTestInsightLogRows(records)
    const sorted = sortInsightLogRows(rows, sort)
    return bookmarkedOnly ? sorted.filter((row) => row.bookmarked) : sorted
  }, [bookmarkedOnly, records, sort])
}
