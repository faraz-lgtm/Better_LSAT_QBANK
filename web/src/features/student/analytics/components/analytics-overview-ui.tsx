import type { ReactNode } from "react"
import { useId, useState } from "react"
import { Link } from "react-router-dom"

import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { LSAT_SCALED_Y_AXIS_LABELS } from "@/features/student/analytics/chart-y-axis"
import { LSAT_GOAL_SCORE_OPTIONS } from "@/features/student/analytics/lsat-goal-score"
import {
  OVERVIEW_SECTION_DRILLS_EXPANDED,
  OVERVIEW_SECTION_DRILLS_MAX,
  averageSectionAccuracyPct,
  formatGapToTargetLabel,
  topOverviewSectionDrills,
} from "@/features/student/analytics/overview-section-drills"
import { DrillDifficultyStatus } from "@/features/student/components/drill-difficulty-status"
import { difficultyMeterFromLabel } from "@/features/student/drills/tag-drills-priority"
import type {
  AnalyticsSection,
  AnalyticsStat,
  QuestionTypeRow as QuestionTypeRowData,
  ScoreProgressPoint,
} from "@/features/student/lib/mock-analytics"

export const SCORE_PROGRESS_TABS = [
  { id: "both", label: "Both" },
  { id: "regular", label: "Regular Score" },
  { id: "blindReview", label: "Untimed Review" },
] as const

export type ScoreProgressTab = (typeof SCORE_PROGRESS_TABS)[number]["id"]

const ANALYTICS_SEGMENTED_TAB_BUTTON_CLASS =
  "flex h-8 items-center justify-center rounded-[10px] px-3.5 text-[11px] font-semibold leading-none tracking-[0.02em] transition-colors"

export function analyticsSegmentedTabClass(active: boolean): string {
  return cn(
    ANALYTICS_SEGMENTED_TAB_BUTTON_CLASS,
    active
      ? "bg-[var(--primary)] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
      : "border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--color-student-heading)] hover:bg-[var(--primary-0)] hover:text-[var(--primary)]",
  )
}

export function StatTile({
  stat,
  compact = false,
}: {
  stat: AnalyticsStat
  compact?: boolean
}) {
  const isBestScore = stat.id === "best-score"
  const isAvgScore = stat.id === "average-score"
  const isHeadlineScore = isBestScore || isAvgScore
  const hasBestCaptionRow = Boolean(stat.caption || stat.captionDetail)
  const hasAvgSideMeta = Boolean(stat.caption || stat.deltaCaption)

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_2px_rgba(13,13,18,0.04)]",
        isHeadlineScore ? "min-h-[148px] justify-between gap-3 p-5" : "gap-1 px-4 py-3.5",
        compact && "w-24",
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <p
          className={cn(
            "m-0 font-semibold leading-[1.4] text-[var(--color-student-heading)]",
            isHeadlineScore ? "text-sm tracking-[0.01em]" : "text-[11px] tracking-[0.02em]",
          )}
        >
          {stat.label}
        </p>

        {isAvgScore ? (
          <div className="flex min-w-0 items-end gap-2.5">
            <p
              className="m-0 shrink-0 text-[36px] font-extrabold leading-none tracking-tight"
              style={{ color: stat.accent }}
            >
              {stat.value}
            </p>
            {hasAvgSideMeta ? (
              <div className="mb-0.5 flex min-w-0 flex-col gap-0.5 text-[11px] leading-[1.35]">
                {stat.caption ? (
                  <span className="truncate font-medium text-[var(--greyscale-500)]">{stat.caption}</span>
                ) : null}
                {stat.deltaCaption ? (
                  <span className="truncate font-semibold text-[#df1c41]">{stat.deltaCaption}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <p
            className={cn(
              "m-0 font-extrabold leading-none tracking-tight",
              isHeadlineScore ? "text-[36px]" : "text-[24px]",
            )}
            style={{ color: stat.accent }}
          >
            {stat.value}
          </p>
        )}

        {isBestScore && hasBestCaptionRow ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {stat.caption ? (
              <span className="inline-flex items-center rounded-full bg-[var(--primary-25)] px-2.5 py-0.5 text-[11px] font-semibold leading-[1.35] text-[var(--primary)]">
                {stat.caption}
              </span>
            ) : null}
            {stat.captionDetail ? (
              <span className="text-[11px] font-medium leading-[1.35] text-[var(--greyscale-500)]">
                {stat.captionDetail}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {stat.progressPct != null ? (
        <div className="flex w-full flex-col gap-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--greyscale-100)]">
            <div
              className="h-full rounded-full bg-[var(--primary)]"
              style={{ width: `${stat.progressPct}%` }}
            />
          </div>
          {stat.progressScaleMin || stat.progressScaleMax ? (
            <div className="flex w-full items-center justify-between text-[10px] font-medium leading-none text-[var(--greyscale-400)]">
              <span>{stat.progressScaleMin ?? ""}</span>
              <span>{stat.progressScaleMax ?? ""}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export function AnalyticsStatsGrid({ stats }: { stats: AnalyticsStat[] }) {
  return (
    <div className="grid h-full grid-cols-2 gap-3">
      {stats.map((stat) => (
        <StatTile key={stat.id} stat={stat} />
      ))}
    </div>
  )
}

/** Figma `21113:22296` — title + tabs + chart (+ optional legend) in one bordered card. */
export function AnalyticsScoreProgressPanel({
  title,
  legend,
  chart,
  footer,
}: {
  title: string
  legend: ReactNode
  chart: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="flex h-full min-h-[200px] w-full flex-col gap-[18px] rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-base font-semibold leading-[1.5] tracking-[0.02em] text-[var(--color-student-heading)]">
          {title}
        </h2>
        {legend}
      </div>
      <div className="min-h-0 w-full flex-1">{chart}</div>
      {footer ? (
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[var(--greyscale-100)] pt-6">
          {footer}
        </div>
      ) : null}
    </section>
  )
}

/** Same Easy/Medium/Hard chip as Drill by Types (question difficulty, not priority). */
function WeaknessDifficultyLabel({ difficulty }: { difficulty: QuestionTypeRowData["difficulty"] }) {
  const meter = difficultyMeterFromLabel(difficulty)
  return (
    <DrillDifficultyStatus
      label={meter.label}
      filledBars={meter.filledBars}
      color={meter.color}
      surface="white"
    />
  )
}

/** Figma weakness donut (node 21147:21178) — lavender accuracy + teal target. */
const WEAKNESS_ACCURACY_COLOR = "#6d78b6"
const WEAKNESS_TARGET_COLOR = "#006699"

function AccuracyDonut({
  accuracyPct,
  goalPct,
}: {
  accuracyPct: number | null
  goalPct?: number | null
}) {
  const size = 92
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const accuracyValue = accuracyPct == null ? 0 : Math.max(0, Math.min(100, accuracyPct))
  const goalValue = goalPct == null ? 0 : Math.max(0, Math.min(100, goalPct))
  const accuracyOffset = circumference - (accuracyValue / 100) * circumference
  const goalOffset = circumference - (goalValue / 100) * circumference
  const centerLabel = accuracyPct != null ? `${Math.round(accuracyPct)}%` : "—"

  return (
    <div className="relative size-[92px] shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--greyscale-100)"
          strokeWidth={stroke}
        />
        {goalValue > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={WEAKNESS_TARGET_COLOR}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={goalOffset}
          />
        ) : null}
        {accuracyValue > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={WEAKNESS_ACCURACY_COLOR}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={accuracyOffset}
          />
        ) : null}
      </svg>
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-2 text-center">
        <span className="text-base font-extrabold leading-none tracking-tight text-[var(--color-student-heading)]">
          {centerLabel}
        </span>
        <span className="mt-1 text-[10px] font-semibold leading-none text-[var(--greyscale-500)]">Accuracy</span>
      </div>
    </div>
  )
}

function WeaknessCard({ row }: { row: QuestionTypeRowData }) {
  const resolvedGap =
    row.gapPct ??
    (row.accuracyPct != null && row.goalPct != null ? row.goalPct - row.accuracyPct : null)
  const gapLabel = row.unlocked ? formatGapToTargetLabel(resolvedGap) : null
  const behindTarget = resolvedGap != null && resolvedGap > 0

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-3.5 shadow-[0px_1px_2px_rgba(13,13,18,0.04)]">
      <div className="flex flex-nowrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate text-sm font-bold leading-[1.3] text-[var(--color-student-heading)]">
            {row.title}
          </h3>
          <p className="mt-0.5 text-[11px] font-medium leading-[1.4] text-[var(--greyscale-500)]">
            {row.averagePerTest.toFixed(1)} average / test
          </p>
        </div>
        <WeaknessDifficultyLabel difficulty={row.difficulty} />
      </div>

      <div className="flex items-center justify-center gap-3">
        <AccuracyDonut accuracyPct={row.accuracyPct} goalPct={row.unlocked ? row.goalPct : null} />
        <div className="flex min-w-0 flex-col gap-1.5">
          {!row.unlocked ? (
            <p className="text-[11px] font-semibold leading-[1.4] text-[var(--greyscale-500)]">
              Keep practicing to unlock this.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold leading-[1.4] text-[var(--color-student-heading)]">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: WEAKNESS_ACCURACY_COLOR }}
                  aria-hidden
                />
                <span>
                  Accuracy{" "}
                  <strong className="font-bold">
                    {row.accuracyPct != null ? `${Math.round(row.accuracyPct)}%` : "—"}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold leading-[1.4] text-[var(--color-student-heading)]">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: WEAKNESS_TARGET_COLOR }}
                  aria-hidden
                />
                <span>
                  Target{" "}
                  <strong className="font-bold">{row.goalPct != null ? `${Math.round(row.goalPct)}%` : "—"}</strong>
                </span>
              </div>
              {gapLabel ? (
                <p
                  className={cn(
                    "m-0 text-[11px] font-bold leading-[1.4]",
                    behindTarget ? "text-[#df1c41]" : "text-[var(--explanation-answered)]",
                  )}
                >
                  {gapLabel}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-end gap-2">
        <Link
          to={`/app/analytics/review/${encodeURIComponent(row.id)}`}
          className="inline-flex h-8 items-center justify-center rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 text-xs font-semibold tracking-[0.02em] text-[var(--primary)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-0)]"
        >
          History
        </Link>
        <Link
          to={`/app/analytics/drills?type=${encodeURIComponent(row.id)}`}
          className="inline-flex h-8 items-center justify-center rounded-[10px] bg-[var(--primary)] px-3 text-xs font-semibold tracking-[0.02em] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-600)]"
        >
          Drill
        </Link>
      </div>
    </article>
  )
}

export function TargetGoalScoreControl({
  value,
  onChange,
  disabled = false,
}: {
  value: number | null
  onChange: (score: number) => void
  disabled?: boolean
}) {
  return (
    <label className="flex shrink-0 flex-col gap-1 sm:items-end">
      <span className="text-[11px] font-semibold leading-[1.4] tracking-[0.02em] text-[var(--greyscale-500)]">
        Target LSAT score
      </span>
      <Select
        aria-label="Target LSAT score"
        value={value != null ? String(value) : ""}
        disabled={disabled}
        options={LSAT_GOAL_SCORE_OPTIONS}
        placeholder="Set target"
        className="h-9 w-[120px] rounded-[10px] bg-[var(--greyscale-0)] px-2.5 pr-9 text-xs font-semibold"
        onChange={(e) => {
          const next = Number.parseInt(e.target.value, 10)
          if (Number.isFinite(next)) onChange(next)
        }}
      />
    </label>
  )
}

export function SectionCard({ section }: { section: AnalyticsSection }) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = section.rows.length > OVERVIEW_SECTION_DRILLS_MAX
  const visibleRows = topOverviewSectionDrills(
    section.rows,
    expanded ? OVERVIEW_SECTION_DRILLS_EXPANDED : OVERVIEW_SECTION_DRILLS_MAX,
  )
  const avgAccuracy = averageSectionAccuracyPct(section.rows)

  return (
    <section className="flex w-full flex-col gap-3 rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex size-7 items-center justify-center rounded-[8px] border"
            style={{ backgroundColor: section.badgeBg, borderColor: section.badgeColor }}
          >
            <span
              className="text-sm font-black leading-none tracking-[0.02em]"
              style={{ color: section.badgeColor }}
            >
              {section.id}
            </span>
          </div>
          <h2 className="m-0 text-base font-bold leading-[1.3] text-[var(--color-student-heading)]">
            {section.title}
          </h2>
        </div>
        <p className="m-0 text-[11px] font-semibold text-[var(--greyscale-500)]">
          Avg accuracy: {avgAccuracy != null ? `${avgAccuracy}%` : "—"}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleRows.map((row) => (
          <WeaknessCard key={row.id} row={row} />
        ))}
      </div>
      {hasMore ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="text-xs font-semibold leading-[1.4] tracking-[0.02em] text-[var(--primary)] transition-colors hover:underline"
            aria-expanded={expanded}
          >
            {expanded ? "See Less" : "See More"}
          </button>
        </div>
      ) : null}
    </section>
  )
}

function formatChartHoverDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  } catch {
    return null
  }
}

export { formatChartHoverDate }

function formatCorrectCaption(
  correct: number | null | undefined,
  total: number | null | undefined,
  percentile?: number | null,
): string | null {
  if (correct != null && Number.isFinite(correct) && total != null && Number.isFinite(total) && total > 0) {
    return `${Math.round(correct)}/${Math.round(total)} Correct`
  }
  if (correct != null && Number.isFinite(correct)) {
    return `${Math.round(correct)} Correct`
  }
  if (percentile != null && Number.isFinite(percentile)) {
    return `${Math.round(percentile)}th percentile`
  }
  return null
}

export type AnalyticsChartTooltipLine = {
  label: string
  value: string
  color: string
  /** Secondary line under the label (e.g. "7/104 Correct"). */
  caption?: string | null
}

function ChartTooltipRadioDot({ color }: { color: string }) {
  return (
    <span className="relative size-4 shrink-0" aria-hidden>
      <span className="absolute inset-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="absolute inset-[4.5px] rounded-full bg-[var(--greyscale-0)]" />
    </span>
  )
}

/** Figma `21114:21160` — light chart hover card used across Insights score charts. */
export function AnalyticsChartTooltip({
  title,
  dateLabel,
  xPct,
  yPct,
  lines,
  id,
}: {
  title: string
  dateLabel?: string | null
  xPct: number
  yPct: number
  lines: readonly AnalyticsChartTooltipLine[]
  id?: string
}) {
  return (
    <div
      id={id}
      role="tooltip"
      className={cn(
        "pointer-events-none absolute z-20 w-[min(100%,260px)] -translate-x-1/2 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--primary-0)] p-3 text-left shadow-[0px_4px_15px_rgba(0,0,0,0.08)]",
        yPct < 28 ? "translate-y-3" : "-translate-y-[calc(100%+12px)]",
      )}
      style={{ left: `${Math.min(88, Math.max(12, xPct))}%`, top: `${yPct}%` }}
    >
      <div className="flex items-center justify-between gap-3 pb-2">
        <p className="m-0 min-w-0 truncate text-sm font-extrabold leading-[1.35] text-[var(--primary)]">
          {title}
        </p>
        {dateLabel ? (
          <p className="m-0 shrink-0 text-xs font-medium leading-[1.5] tracking-[0.02em] text-[var(--greyscale-500)]">
            {dateLabel}
          </p>
        ) : null}
      </div>

      <div className="h-px w-full bg-[var(--greyscale-100)]" aria-hidden />

      {lines.length > 0 ? (
        <div className="flex flex-col pt-1">
          {lines.map((line) => (
            <div key={`${line.label}-${line.value}`} className="flex flex-col justify-center py-2">
              <div className="flex items-center gap-2">
                <ChartTooltipRadioDot color={line.color} />
                <p className="m-0 min-w-0 flex-1 truncate text-sm font-normal leading-[1.5] tracking-[0.02em] text-[var(--greyscale-500)]">
                  {line.label.endsWith(":") ? line.label : `${line.label}:`}
                </p>
                <p
                  className="m-0 shrink-0 text-right text-xl font-extrabold leading-[1.5] tracking-[0.02em] tabular-nums"
                  style={{ color: line.color }}
                >
                  {line.value}
                </p>
              </div>
              {line.caption ? (
                <p className="m-0 pl-6 text-xs font-medium leading-[1.5] tracking-[0.02em] text-[var(--color-student-heading)]">
                  {line.caption}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Catmull-Rom → cubic Bezier path for a smoother Figma-style trend line. */
function smoothSvgPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`
  if (points.length === 2) {
    return `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)} L ${points[1]!.x.toFixed(2)} ${points[1]!.y.toFixed(2)}`
  }

  let d = `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

type ChartHoverState = {
  index: number
  series: "regular" | "blind"
  xPct: number
  yPct: number
}

export function ScoreProgressChart({
  points,
  tab,
  variant = "default",
}: {
  points: ScoreProgressPoint[]
  tab: ScoreProgressTab
  variant?: "default" | "dashboard"
}) {
  const tooltipId = useId()
  const [hover, setHover] = useState<ChartHoverState | null>(null)

  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-[var(--greyscale-500)]">Complete a PrepTest to see your score progress.</p>
    )
  }

  const yAxisLabels = LSAT_SCALED_Y_AXIS_LABELS
  const minVal = yAxisLabels[yAxisLabels.length - 1] ?? 120
  const maxVal = yAxisLabels[0] ?? 180
  const range = Math.max(1, maxVal - minVal)
  const stepX = 100 / points.length
  const dashboard = variant === "dashboard"

  const yFor = (value: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, value))
    return ((maxVal - clamped) / range) * 100
  }

  const xFor = (index: number) => stepX * index + stepX / 2

  const regularPoints = points.map((p, i) => ({ x: xFor(i), y: yFor(p.regular) }))
  const blindPoints = points.map((p, i) => ({ x: xFor(i), y: yFor(p.blindReview) }))

  const showRegular = tab === "regular" || tab === "both"
  const showBlind = tab === "blindReview" || tab === "both"

  const regularPath = smoothSvgPath(regularPoints)
  const areaPath =
    regularPoints.length > 0
      ? `${regularPath} L ${regularPoints[regularPoints.length - 1]!.x.toFixed(2)} 100 L ${regularPoints[0]!.x.toFixed(2)} 100 Z`
      : ""
  const connectBlind = dashboard && showBlind
  const blindPath = connectBlind ? smoothSvgPath(blindPoints) : ""

  const hoveredPoint = hover ? points[hover.index] : null
  const hoverDate = hoveredPoint ? formatChartHoverDate(hoveredPoint.completedAt) : null

  return (
    <div className="flex h-[240px] w-full items-stretch gap-3 pb-6">
      <div
        className={cn(
          "flex h-[calc(100%-1.5rem)] flex-col justify-between py-0.5 pr-3 text-xs font-medium leading-4",
          dashboard ? "text-[var(--greyscale-500)]" : "text-[var(--color-student-heading)]",
        )}
      >
        {yAxisLabels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden>
          {yAxisLabels.map((label, index) => (
            <div key={`${label}-${index}`} className="h-px w-full bg-[var(--greyscale-100)]" />
          ))}
        </div>
        <svg
          className="absolute inset-x-0 top-0 bottom-6 h-[calc(100%-1.5rem)] w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {showRegular ? (
            <>
              <path d={areaPath} fill="var(--primary)" fillOpacity="0.1" />
              <path
                d={regularPath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="0.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : null}
          {connectBlind ? (
            <path
              d={blindPath}
              fill="none"
              stroke="#ff6f00"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        <div className="absolute inset-x-0 top-0 bottom-6">
          {showRegular
            ? regularPoints.map((p, i) => {
                const active = hover?.index === i && hover.series === "regular"
                return (
                  <button
                    key={`r-${i}`}
                    type="button"
                    className={cn(
                      "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)] outline-none ring-[var(--primary)]/30 transition-transform focus-visible:ring-2",
                      dashboard ? "size-[10px]" : "size-3",
                      active && "scale-125 ring-2",
                    )}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    aria-describedby={active ? tooltipId : undefined}
                    aria-label={`${points[i]!.test} regular score ${points[i]!.regular}`}
                    onMouseEnter={() => setHover({ index: i, series: "regular", xPct: p.x, yPct: p.y })}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover({ index: i, series: "regular", xPct: p.x, yPct: p.y })}
                    onBlur={() => setHover(null)}
                  />
                )
              })
            : null}
          {showBlind
            ? blindPoints.map((p, i) => {
                const active = hover?.index === i && hover.series === "blind"
                return (
                  <button
                    key={`b-${i}`}
                    type="button"
                    className={cn(
                      "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff6f00] outline-none ring-[#ff6f00]/30 transition-transform focus-visible:ring-2",
                      dashboard ? "size-[10px]" : "size-3",
                      active && "scale-125 ring-2",
                    )}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    aria-describedby={active ? tooltipId : undefined}
                    aria-label={`${points[i]!.test} untimed review ${points[i]!.blindReview}`}
                    onMouseEnter={() => setHover({ index: i, series: "blind", xPct: p.x, yPct: p.y })}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover({ index: i, series: "blind", xPct: p.x, yPct: p.y })}
                    onBlur={() => setHover(null)}
                  />
                )
              })
            : null}

          {hover && hoveredPoint ? (
            <AnalyticsChartTooltip
              id={tooltipId}
              title={hoveredPoint.test}
              dateLabel={hoverDate}
              xPct={hover.xPct}
              yPct={hover.yPct}
              lines={[
                ...(showRegular
                  ? [
                      {
                        label: "Regular Score",
                        value: String(hoveredPoint.regular),
                        color: "var(--primary)",
                        caption: formatCorrectCaption(
                          hoveredPoint.regularRawScore,
                          hoveredPoint.questionCount,
                          hoveredPoint.percentile,
                        ),
                      },
                    ]
                  : []),
                ...(showBlind
                  ? [
                      {
                        label: "Untimed Review",
                        value: String(hoveredPoint.blindReview),
                        color: "#ff6f00",
                        caption: formatCorrectCaption(
                          hoveredPoint.blindReviewRawScore,
                          hoveredPoint.questionCount,
                          hoveredPoint.blindReviewPercentile,
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          ) : null}
        </div>

        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 flex justify-between gap-1 whitespace-nowrap",
            dashboard
              ? "text-xs leading-4 text-[#6a7282]"
              : "text-[11px] leading-4 text-[var(--color-student-heading)] sm:text-xs",
          )}
        >
          {points.map((p, i) => (
            <span key={`${p.test}-${i}`} className="min-w-0 flex-1 truncate text-center">
              {p.test}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ScoreProgressTabs({
  value,
  onChange,
  variant = "default",
}: {
  value: ScoreProgressTab
  onChange: (next: ScoreProgressTab) => void
  variant?: "default" | "dashboard"
}) {
  const dashboard = variant === "dashboard"

  return (
    <div
      className={cn(
        "flex h-10 flex-wrap items-center gap-2 rounded-[10px] bg-[var(--greyscale-0)] p-1",
        dashboard && "gap-1",
      )}
    >
      {SCORE_PROGRESS_TABS.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex h-8 items-center justify-center rounded-[10px] px-3 text-xs leading-[1.5] tracking-[0.02em] transition-colors",
              active
                ? "bg-[var(--primary)] font-bold text-white"
                : "font-normal text-[var(--color-student-heading)] hover:bg-[var(--primary-0)]",
            )}
            aria-pressed={active}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
