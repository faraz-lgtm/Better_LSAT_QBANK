import type { ReactNode } from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { LSAT_SCALED_Y_AXIS_LABELS } from "@/features/student/analytics/chart-y-axis"
import { visibleOverviewSectionDrillCount } from "@/features/student/analytics/overview-section-drills"
import type {
  AnalyticsSection,
  AnalyticsStat,
  Difficulty,
  QuestionTypeRow as QuestionTypeRowData,
  ScoreProgressPoint,
} from "@/features/student/lib/mock-analytics"

const DIFFICULTY_META: Record<Difficulty, { dots: number; color: string }> = {
  Easiest: { dots: 1, color: "#ffbd4c" },
  Easy: { dots: 2, color: "#ffbd4c" },
  Medium: { dots: 3, color: "#0bbcc9" },
  Hard: { dots: 4, color: "#df1c41" },
  Hardest: { dots: 5, color: "#df1c41" },
}

export const SCORE_PROGRESS_TABS = [
  { id: "regular", label: "Regular Score" },
  { id: "blindReview", label: "Blind Review" },
  { id: "both", label: "Both" },
] as const

export type ScoreProgressTab = (typeof SCORE_PROGRESS_TABS)[number]["id"]

const ANALYTICS_SEGMENTED_TAB_BUTTON_CLASS =
  "flex h-7 items-center justify-center rounded-[8px] px-2.5 text-xs font-semibold leading-[1.4] tracking-[0.02em] transition-colors hover:rounded-[8px] active:rounded-[8px] focus-visible:rounded-[8px]"

export function StatTile({
  stat,
  compact = false,
}: {
  stat: AnalyticsStat
  compact?: boolean
}) {
  return (
    <article className={cn("ds-analytics-stat", compact && "ds-analytics-stat--compact")}>
      <p className="ds-analytics-stat__label">{stat.label}</p>
      <p className="ds-analytics-stat__value" style={{ color: stat.accent }}>
        {stat.value}
      </p>
      {stat.caption ? <p className="ds-analytics-stat__caption">{stat.caption}</p> : null}
    </article>
  )
}

export function AnalyticsStatsGrid({ stats }: { stats: AnalyticsStat[] }) {
  return (
    <article className="flex h-full min-h-[200px] flex-col justify-center rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-3 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
      <div className="grid h-full grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="flex min-w-0 flex-col justify-center gap-0.5 rounded-[12px] bg-[var(--greyscale-25)] p-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-student-heading)]">{stat.label}</p>
            <p
              className="text-[26px] font-extrabold leading-[1.1] tracking-tight sm:text-[28px]"
              style={{ color: stat.accent }}
            >
              {stat.value}
            </p>
            {stat.caption ? (
              <p className="text-[11px] font-semibold tracking-[0.02em] text-[var(--color-student-heading)]">{stat.caption}</p>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  )
}

export function AnalyticsScoreProgressPanel({
  title,
  legend,
  chart,
}: {
  title: string
  legend: ReactNode
  chart: ReactNode
}) {
  return (
    <section className="flex h-full min-h-[200px] flex-col rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-4 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-student-heading)]">{title}</h2>
        {legend}
      </div>
      <div className="min-h-0 flex-1">{chart}</div>
    </section>
  )
}

function DifficultyPill({ difficulty }: { difficulty: Difficulty }) {
  const { dots, color } = DIFFICULTY_META[difficulty]
  return (
    <div className="flex h-7 w-fit shrink-0 items-center gap-1.5 rounded-[8px] bg-[var(--primary-0)] px-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="block h-2.5 w-[4px] rounded-full"
            style={{ backgroundColor: i < dots ? color : "var(--primary-50)" }}
          />
        ))}
      </div>
      <span className="text-[11px] font-semibold leading-[1.4] tracking-[0.02em]" style={{ color }}>
        {difficulty}
      </span>
    </div>
  )
}

function AccuracyProgress({
  accuracy,
  goal,
  unlocked,
}: {
  accuracy: number | null
  goal: number | null
  unlocked: boolean
}) {
  if (!unlocked || accuracy == null) {
    return (
      <div className="flex w-[180px] shrink-0 flex-col gap-1">
        <span className="text-[11px] font-semibold leading-[1.4] tracking-[0.02em] text-[var(--greyscale-500)]">
          Keep practicing to unlock this.
        </span>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--greyscale-100)]" />
      </div>
    )
  }
  if (goal == null) {
    return (
      <div className="flex w-[180px] shrink-0 flex-col gap-1">
        <span className="text-[11px] font-semibold leading-[1.4] tracking-[0.02em] text-[var(--primary)]">
          Your accuracy: {Math.max(0, Math.min(100, accuracy))}%
        </span>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--greyscale-100)]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--primary)]"
            style={{ width: `${Math.max(0, Math.min(100, accuracy))}%` }}
          />
        </div>
      </div>
    )
  }
  const safeAccuracy = Math.max(0, Math.min(100, accuracy))
  const safeGoal = Math.max(0, Math.min(100, goal))
  return (
    <div className="flex w-[180px] shrink-0 flex-col gap-1">
      <div className="flex h-4 items-center justify-between">
        <span className="text-[11px] font-semibold leading-[1.4] tracking-[0.02em] text-[var(--primary)]">
          Your accuracy: {safeAccuracy}%
        </span>
        <span className="text-[11px] font-semibold leading-[1.4] tracking-[0.02em] text-[#df1c41]">
          Goal: {safeGoal}%
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--greyscale-100)]">
        <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--primary)]" style={{ width: `${safeAccuracy}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-[#df1c41]" style={{ left: `calc(${safeGoal}% - 1px)` }} />
      </div>
    </div>
  )
}

const PRIORITY_BAR: Record<string, string> = {
  highest: "#df1c41",
  high: "#ff6f00",
  medium: "#ffbd4c",
  low: "#00bc54",
}

function QuestionTypeRow({ row, accentBar }: { row: QuestionTypeRowData; accentBar: string }) {
  const barColor = (row.priorityTier && PRIORITY_BAR[row.priorityTier]) || accentBar
  return (
    <div className="flex min-h-[56px] min-w-[720px] items-center justify-between border-b border-[var(--greyscale-100)] px-4 py-2 last:border-b-0">
      <div className="flex w-[300px] shrink-0 items-center gap-3">
        <div
          className="h-10 w-1 shrink-0 rounded-br-[8px] rounded-tr-[8px]"
          style={{ backgroundColor: barColor }}
          aria-hidden
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm font-semibold leading-[1.35] text-[var(--color-student-heading)]">{row.title}</p>
          <p className="text-[11px] font-semibold leading-[1.4] tracking-[0.02em] text-[var(--greyscale-500)]">
            {row.averagePerTest.toFixed(1)} questions avg. per test
          </p>
          {row.unlocked &&
          row.accuracyPct != null &&
          row.goalPct != null &&
          row.extraCorrectNeededPerTest != null &&
          row.extraCorrectNeededPerTest > 0 ? (
            <p className="text-[11px] leading-[1.35] text-[var(--greyscale-500)]">
              Closing the gap requires getting{" "}
              <strong className="font-semibold text-[var(--color-student-heading)]">{row.extraCorrectNeededPerTest}</strong> more
              correct per test in this tag.
            </p>
          ) : null}
        </div>
      </div>

      <DifficultyPill difficulty={row.difficulty} />
      <AccuracyProgress accuracy={row.accuracyPct} goal={row.goalPct} unlocked={row.unlocked} />

      <Link
        to={`/app/analytics/review/${encodeURIComponent(row.id)}`}
        className="flex h-8 shrink-0 items-center justify-center rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 text-xs font-semibold tracking-[0.02em] text-[var(--primary)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-0)]"
      >
        Review ({row.reviewCount})
      </Link>
      <Link
        to={`/app/analytics/drills?type=${encodeURIComponent(row.id)}`}
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--primary)] px-3 text-xs font-semibold tracking-[0.02em] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-600)]"
      >
        Drill
      </Link>
    </div>
  )
}

export function SectionCard({ section }: { section: AnalyticsSection }) {
  const [expanded, setExpanded] = useState(false)
  const visibleCount = visibleOverviewSectionDrillCount(section.rows.length, expanded)
  const visibleRows = section.rows.slice(0, visibleCount)
  const canToggle = section.rows.length > visibleOverviewSectionDrillCount(section.rows.length, false)

  return (
    <section className="mb-4 flex w-full flex-col gap-3 rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-4">
      <div className="flex items-center rounded-[12px] bg-[var(--greyscale-25)] px-3 py-2">
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
          <h2 className="text-base font-bold leading-[1.3] text-[var(--color-student-heading)]">{section.title}</h2>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex flex-col">
          {visibleRows.map((row) => (
            <QuestionTypeRow key={row.id} row={row} accentBar={section.accentBar} />
          ))}
        </div>
      </div>
      {canToggle ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 text-xs font-semibold tracking-[0.02em] text-[var(--primary)] hover:bg-[var(--greyscale-25)]"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? (
              <>
                Show less
                <ChevronUp className="size-4" />
              </>
            ) : (
              <>
                Show more ({section.rows.length - visibleCount} more)
                <ChevronDown className="size-4" />
              </>
            )}
          </button>
        </div>
      ) : null}
    </section>
  )
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

  const regularPolyline = regularPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
  const blindPolyline = blindPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")

  return (
    <div className="flex h-[220px] w-full items-stretch gap-3">
      <div
        className={cn(
          "flex h-full flex-col justify-between py-0.5 pr-3 text-xs font-medium leading-4",
          dashboard ? "text-[var(--greyscale-500)]" : "text-[var(--color-student-heading)]",
        )}
      >
        {yAxisLabels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
          {yAxisLabels.map((label, index) => (
            <div key={`${label}-${index}`} className="h-px w-full bg-[var(--greyscale-100)]" />
          ))}
        </div>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {showRegular ? (
            <>
              <polyline
                points={regularPolyline}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="0.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <polygon
                points={`${regularPoints[0]!.x},100 ${regularPolyline} ${regularPoints[regularPoints.length - 1]!.x},100`}
                fill="var(--primary)"
                fillOpacity="0.08"
              />
            </>
          ) : null}
          {showBlind && !dashboard ? (
            <polyline
              points={blindPolyline}
              fill="none"
              stroke="#ff6f00"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {showRegular
            ? regularPoints.map((p, i) => (
                <span
                  key={`r-${i}`}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]",
                    dashboard ? "size-[10px]" : "size-2.5",
                  )}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                />
              ))
            : null}
          {showBlind
            ? blindPoints.map((p, i) => (
                <span
                  key={`b-${i}`}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff6f00]",
                    dashboard ? "size-[10px]" : "size-2.5",
                  )}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                />
              ))
            : null}
        </div>
        <div
          className={cn(
            "absolute left-0 right-0 flex justify-between gap-1 whitespace-nowrap",
            dashboard
              ? "-bottom-8 text-xs leading-4 text-[#6a7282]"
              : "-bottom-7 text-[11px] leading-4 text-[var(--color-student-heading)] sm:text-xs",
          )}
        >
          {points.map((p) => (
            <span key={p.test} className="min-w-0 flex-1 truncate text-center">
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
        "flex h-8 items-center gap-1.5 p-0.5",
        dashboard ? "rounded-[8px] bg-[var(--greyscale-0)]" : "rounded-[10px] bg-[var(--greyscale-0)]",
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
              dashboard
                ? "flex h-7 items-center justify-center rounded-md px-2.5 text-xs font-semibold leading-[1.4] tracking-[0.28px] transition-colors"
                : ANALYTICS_SEGMENTED_TAB_BUTTON_CLASS,
              active
                ? "bg-[var(--primary)] text-white"
                : dashboard
                  ? "text-[var(--greyscale-500)] hover:bg-[var(--primary-0)]"
                  : "text-[var(--greyscale-500)] hover:bg-[var(--primary-0)]",
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
