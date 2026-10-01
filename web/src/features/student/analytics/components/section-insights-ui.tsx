import { useState } from "react"
import { Bookmark, Check } from "lucide-react"

import {
  AnalyticsChartTooltip,
  analyticsSegmentedTabClass,
  formatChartHoverDate,
} from "@/features/student/analytics/components/analytics-overview-ui"
import {
  buildSectionYAxisLabels,
  resolveSectionChartMax,
} from "@/features/student/analytics/section-progress-axis"
import { LSAT_SCALED_Y_AXIS_LABELS } from "@/features/student/analytics/chart-y-axis"
import {
  formatSectionMissedSigned,
  rollingAverageSeries,
  sectionTrajectoryValues,
  type SectionInsightAttempt,
  type SectionInsightKind,
  type SectionInsightStats,
  type SectionTrajectoryPoint,
} from "@/features/student/analytics/section-insights"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import { cn } from "@/lib/utils"

const BOOKMARK_OUTLINE_ICON = "/figma/preptest-insights/bookmark-outline.svg"
const TRAJECTORY_LINE = "#0b3d91"
const TRAJECTORY_ORANGE = "#c2560c"
const TRAJECTORY_GRID = "#e6ebf3"
const MUTED = "#5a6782"
const HEADING = "#041a44"

export type SectionTrajectoryTab = "correct" | "scaled"
export type SectionArchiveSort = "recent" | "gains"

export function SectionKindSwitcher({
  active,
  lrCount,
  rcCount,
  onChange,
}: {
  active: SectionInsightKind
  lrCount: number
  rcCount: number
  onChange: (next: SectionInsightKind) => void
}) {
  const cards: Array<{ id: SectionInsightKind; title: string; count: number }> = [
    { id: "LR", title: "Logical Reasoning", count: lrCount },
    { id: "RC", title: "Reading Comprehension", count: rcCount },
  ]
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {cards.map((card) => {
        const selected = active === card.id
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onChange(card.id)}
            aria-pressed={selected}
            className={cn(
              "flex flex-col items-start rounded-[18px] border border-solid p-6 text-left transition-colors",
              selected
                ? "border-[var(--primary)] bg-[var(--primary-25)] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
                : "border-[var(--greyscale-100)] bg-[var(--greyscale-0)] hover:bg-[var(--primary-0)]",
            )}
          >
            <div className="flex items-center gap-3">
              <SectionInitialBadge section={card.id} variant="compact" />
              <span className="text-base font-semibold leading-[1.35]" style={{ color: HEADING }}>
                {card.title}
              </span>
            </div>
            <p
              className="m-0 mt-1.5 pl-11 text-sm font-normal leading-[1.5] tracking-[0.28px]"
              style={{ color: MUTED }}
            >
              {card.count} attempt{card.count === 1 ? "" : "s"} in range
            </p>
          </button>
        )
      })}
    </div>
  )
}

function InsightStatCard({
  label,
  value,
  valueColor,
  footer,
}: {
  label: string
  value: string
  valueColor: string
  footer: string
}) {
  return (
    <article className="flex min-w-0 flex-col gap-[5px] rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6">
      <p
        className="m-0 text-sm font-semibold leading-[1.5] tracking-[0.28px]"
        style={{ color: HEADING }}
      >
        {label}
      </p>
      <p className="m-0 text-[32px] font-black leading-[1.25]" style={{ color: valueColor }}>
        {value}
      </p>
      <div className="flex h-[30px] items-center pt-2">
        <p
          className="m-0 text-xs font-normal leading-[1.5] tracking-[0.24px]"
          style={{ color: MUTED }}
        >
          {footer}
        </p>
      </div>
    </article>
  )
}

export function SectionInsightStatsRow({
  stats,
  kind,
}: {
  stats: SectionInsightStats
  kind: SectionInsightKind
}) {
  const peakColor = kind === "LR" ? "var(--explanation-answered)" : "var(--explanation-teal)"
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <InsightStatCard
        label="Peak Performance"
        value={formatSectionMissedSigned(stats.peakMissed, 0)}
        valueColor={peakColor}
        footer={stats.peakLabel}
      />
      <InsightStatCard
        label="Trailing Average"
        value={formatSectionMissedSigned(stats.trailingAvgMissed, 1)}
        valueColor="var(--primary)"
        footer={`Across ${stats.attemptCount} attempt${stats.attemptCount === 1 ? "" : "s"}`}
      />
      <InsightStatCard
        label="Accuracy"
        value={`${stats.accuracyPct}%`}
        valueColor="var(--primary)"
        footer={`${stats.correctTotal} of ${stats.questionTotal} questions`}
      />
      <InsightStatCard
        label="Momentum"
        value={stats.momentum == null ? "—" : formatMomentum(stats.momentum)}
        valueColor="var(--primary)"
        footer="Fewer misses, recent half vs. earlier half"
      />
    </div>
  )
}

function formatMomentum(value: number): string {
  if (value > 0) return `+${Math.abs(value).toFixed(1)}`
  if (value < 0) return `\u2212${Math.abs(value).toFixed(1)}`
  return "0.0"
}

function TrajectoryTabs({
  value,
  onChange,
}: {
  value: SectionTrajectoryTab
  onChange: (next: SectionTrajectoryTab) => void
}) {
  const tabs: Array<{ id: SectionTrajectoryTab; label: string }> = [
    { id: "correct", label: "Total Correct" },
    { id: "scaled", label: "PT equivalent score" },
  ]
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[10px] bg-[var(--greyscale-0)] p-1">
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
                : "border border-[var(--greyscale-100)] bg-[var(--primary-25)] text-[var(--color-student-heading)] hover:bg-[var(--primary-0)]",
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function SectionTrajectoryChart({
  points,
  tab,
  kind,
}: {
  points: SectionTrajectoryPoint[]
  tab: SectionTrajectoryTab
  kind: SectionInsightKind
}) {
  const chartPoints = points
  const values = sectionTrajectoryValues(chartPoints, tab)
  const rolling = rollingAverageSeries(values)
  const yAxisLabels =
    tab === "scaled"
      ? LSAT_SCALED_Y_AXIS_LABELS
      : buildSectionYAxisLabels(
          resolveSectionChartMax(
            chartPoints.map((p) => p.questionCount),
            chartPoints.map((p) => p.correct),
            kind,
          ),
        )
  const minVal = yAxisLabels[yAxisLabels.length - 1] ?? 0
  const maxVal = yAxisLabels[0] ?? 1
  const range = Math.max(1, maxVal - minVal)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (chartPoints.length === 0) {
    return (
      <div className="flex h-[284px] items-center justify-center rounded-xl border border-dashed border-[var(--greyscale-100)] text-xs text-[var(--greyscale-500)]">
        No sections in the selected range.
      </div>
    )
  }

  const yFor = (value: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, value))
    return ((maxVal - clamped) / range) * 100
  }
  const xFor = (index: number) =>
    chartPoints.length <= 1 ? 50 : (index / (chartPoints.length - 1)) * 100

  const linePoints = values.map((value, i) => ({ x: xFor(i), y: yFor(value) }))
  const polyline = linePoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
  const areaPolygon =
    linePoints.length > 0
      ? `${linePoints[0]!.x.toFixed(2)},100 ${polyline} ${linePoints[linePoints.length - 1]!.x.toFixed(2)},100`
      : ""
  const rollingPolyline = rolling
    .map((value, i) => (value == null ? null : { x: xFor(i), y: yFor(value) }))
    .filter((p): p is { x: number; y: number } => p != null)
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ")
  const hovered = hoverIndex != null ? chartPoints[hoverIndex] : null
  const hoveredCoords = hoverIndex != null ? linePoints[hoverIndex] : null

  return (
    <div className="w-full">
      <div className="flex h-[284px] w-full items-stretch gap-3 overflow-visible">
        <div
          className="flex h-full flex-col justify-between pr-2 text-sm font-medium leading-5"
          style={{ color: HEADING }}
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
              <polygon points={areaPolygon} fill={TRAJECTORY_LINE} fillOpacity={0.07} />
            ) : null}
            {rollingPolyline ? (
              <polyline
                points={rollingPolyline}
                fill="none"
                stroke={TRAJECTORY_ORANGE}
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
              const displayValue = tab === "correct" ? point.correct : point.ptEquivalent
              return (
                <button
                  key={point.id}
                  type="button"
                  className={cn(
                    "absolute z-10 size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] bg-white outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30",
                    isActive && "scale-125",
                  )}
                  style={{ left: `${coords.x}%`, top: `${coords.y}%`, borderColor: TRAJECTORY_LINE }}
                  aria-label={`${point.label}: ${displayValue}`}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onFocus={() => setHoverIndex(i)}
                  onBlur={() => setHoverIndex(null)}
                />
              )
            })}
            {hovered && hoveredCoords ? (
              <AnalyticsChartTooltip
                title={hovered.label}
                dateLabel={formatChartHoverDate(hovered.takenAt)}
                xPct={hoveredCoords.x}
                yPct={hoveredCoords.y}
                lines={[
                  {
                    label: tab === "correct" ? "Total Correct" : "PT equivalent",
                    value: String(tab === "correct" ? hovered.correct : hovered.ptEquivalent),
                    color: TRAJECTORY_LINE,
                    caption: `${hovered.correct}/${hovered.questionCount} Correct`,
                  },
                  ...(rolling[hoverIndex!] != null
                    ? [
                        {
                          label: "5-attempt rolling avg",
                          value: String(rolling[hoverIndex!]),
                          color: TRAJECTORY_ORANGE,
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

export function SectionTrajectoryPanel({
  points,
  tab,
  onTabChange,
  kind,
}: {
  kind: SectionInsightKind
  points: SectionTrajectoryPoint[]
  tab: SectionTrajectoryTab
  onTabChange: (next: SectionTrajectoryTab) => void
}) {
  return (
    <section className="rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6">
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="!m-0 !text-base !font-semibold !leading-[1.5] tracking-[0.32px] text-[#0e1b33]">
            Reasoning Trajectory
          </h2>
          <div className="flex flex-wrap items-center gap-5 text-xs font-medium tracking-[0.24px]" style={{ color: MUTED }}>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-[3px] w-[18px] rounded-[2px]" style={{ background: TRAJECTORY_LINE }} aria-hidden />
              Each Attempt
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-0 w-[18px] border-t-2 border-dashed"
                style={{ borderColor: TRAJECTORY_ORANGE }}
                aria-hidden
              />
              5-attempt rolling average
            </span>
          </div>
        </div>
        <TrajectoryTabs value={tab} onChange={onTabChange} />
      </div>
      <SectionTrajectoryChart points={points} tab={tab} kind={kind} />
    </section>
  )
}

function AttemptArchiveCard({
  attempt,
  onSelect,
  onToggleBookmark,
}: {
  attempt: SectionInsightAttempt
  onSelect: (id: string) => void
  onToggleBookmark: (id: string) => void
}) {
  return (
    <article className="flex min-h-[172px] flex-col gap-2.5 rounded-[14px] border border-[#dde4ef] bg-[var(--greyscale-0)] p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelect(attempt.id)}
          className="m-0 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#0b3d91] hover:underline"
        >
          {attempt.testLabel}
        </button>
        <button
          type="button"
          aria-label={attempt.bookmarked ? "Remove bookmark" : "Bookmark attempt"}
          aria-pressed={attempt.bookmarked}
          onClick={() => onToggleBookmark(attempt.id)}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] hover:bg-[var(--primary-0)]"
        >
          {attempt.bookmarked ? (
            <Bookmark className="size-4 fill-[var(--primary)] text-[var(--primary)]" aria-hidden />
          ) : (
            <img src={BOOKMARK_OUTLINE_ICON} alt="" className="h-[13px] w-[10px]" width={10} height={13} />
          )}
        </button>
      </div>
      <p className="m-0 text-xs font-normal leading-[1.5] tracking-[0.24px]" style={{ color: MUTED }}>
        {attempt.dateLabel}
      </p>
      <p className="m-0 text-[32px] font-bold leading-[1.25] text-[var(--primary)]">
        {formatSectionMissedSigned(attempt.missed, 0)}
      </p>
      <p className="m-0 text-xs font-normal leading-[1.5] tracking-[0.24px]" style={{ color: MUTED }}>
        {attempt.correct} of {attempt.questionCount} correct · {attempt.ptEquivalent} est.
      </p>
      <div className="mt-auto border-t border-[var(--greyscale-100)] pt-2.5">
        <p className="m-0 text-xs font-medium leading-[1.5]" style={{ color: MUTED }}>
          {attempt.untimedCorrectDelta == null
            ? "No untimed review"
            : `${attempt.untimedCorrectDelta > 0 ? "+" : ""}${attempt.untimedCorrectDelta} correct on untimed review`}
        </p>
      </div>
    </article>
  )
}

export function SectionAttemptArchive({
  attempts,
  sort,
  onSortChange,
  onSelect,
  onToggleBookmark,
}: {
  attempts: SectionInsightAttempt[]
  sort: SectionArchiveSort
  onSortChange: (next: SectionArchiveSort) => void
  onSelect: (id: string) => void
  onToggleBookmark: (id: string) => void
}) {
  const sortOptions: Array<{ id: SectionArchiveSort; label: string }> = [
    { id: "recent", label: "Most recent" },
    { id: "gains", label: "Biggest gains" },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-[52px] flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="!m-0 !text-base !font-semibold !leading-[1.5] tracking-[0.32px] text-[#0e1b33]">
            Attempt Archive
          </h2>
          <p className="m-0 text-xs font-normal leading-[1.5] tracking-[0.24px]" style={{ color: MUTED }}>
            Each card compares that attempt to your average over the 5 attempts before it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sort attempts">
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

      {attempts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--greyscale-100)] px-6 py-10 text-center text-sm text-[var(--greyscale-500)]">
          No section attempts in this range.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {attempts.map((attempt) => (
            <AttemptArchiveCard
              key={attempt.id}
              attempt={attempt}
              onSelect={onSelect}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  )
}
