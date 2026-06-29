import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"
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

const Y_AXIS_LABELS = [100, 84, 68, 52, 36, 20] as const

export const SCORE_PROGRESS_TABS = [
  { id: "regular", label: "Regular Score" },
  { id: "blindReview", label: "Blind Review" },
  { id: "both", label: "Both" },
] as const

export type ScoreProgressTab = (typeof SCORE_PROGRESS_TABS)[number]["id"]

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
    <article className="flex h-full min-h-[280px] flex-col justify-center rounded-[16px] border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)] sm:p-5">
      <div className="grid h-full grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="flex min-w-0 flex-col justify-center gap-1 rounded-[16px] bg-[#f6f8fa] p-4 sm:p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#062357]">{stat.label}</p>
            <p
              className="text-[40px] font-extrabold leading-[1.1] tracking-tight sm:text-[44px]"
              style={{ color: stat.accent }}
            >
              {stat.value}
            </p>
            {stat.caption ? (
              <p className="text-xs font-semibold tracking-[0.02em] text-[#062357]">{stat.caption}</p>
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
    <section className="flex h-full min-h-[280px] flex-col rounded-[16px] border border-[#dfe1e7] bg-white p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#062357]">{title}</h2>
        {legend}
      </div>
      <div className="min-h-0 flex-1">{chart}</div>
    </section>
  )
}

function DifficultyPill({ difficulty }: { difficulty: Difficulty }) {
  const { dots, color } = DIFFICULTY_META[difficulty]
  return (
    <div className="flex h-10 w-[132px] shrink-0 items-center gap-2.5 rounded-[10px] bg-[#f3f7ff] px-2.5">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="block h-4 w-[6px] rounded-full"
            style={{ backgroundColor: i < dots ? color : "#ced0e7" }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold leading-[1.5] tracking-[0.02em]" style={{ color }}>
        {difficulty}
      </span>
    </div>
  )
}

function AccuracyProgress({ accuracy, goal }: { accuracy: number; goal: number }) {
  const safeAccuracy = Math.max(0, Math.min(100, accuracy))
  const safeGoal = Math.max(0, Math.min(100, goal))
  return (
    <div className="flex w-[232px] shrink-0 flex-col gap-2">
      <div className="flex h-5 items-center justify-between">
        <span className="text-xs font-semibold leading-[1.5] tracking-[0.02em] text-[#0d47a1]">
          Your accuracy: {safeAccuracy}%
        </span>
        <span className="text-xs font-semibold leading-[1.5] tracking-[0.02em] text-[#df1c41]">Goal: {safeGoal}%</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#dfe1e7]">
        <div className="absolute inset-y-0 left-0 rounded-full bg-[#0d47a1]" style={{ width: `${safeAccuracy}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-[#df1c41]" style={{ left: `calc(${safeGoal}% - 1px)` }} />
      </div>
    </div>
  )
}

function QuestionTypeRow({ row, accentBar }: { row: QuestionTypeRowData; accentBar: string }) {
  return (
    <div className="flex h-[88px] min-w-[880px] items-center justify-between border-b border-[#dfe1e7] px-6 last:border-b-0">
      <div className="flex w-[392px] shrink-0 items-center gap-6">
        <div
          className="h-14 w-1 shrink-0 rounded-br-[10px] rounded-tr-[10px]"
          style={{ backgroundColor: accentBar }}
          aria-hidden
        />
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-base font-semibold leading-[1.35] text-[#062357]">{row.title}</p>
          <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
            {row.averagePerTest.toFixed(1)} questions avg. per test
          </p>
        </div>
      </div>

      <DifficultyPill difficulty={row.difficulty} />
      <AccuracyProgress accuracy={row.accuracyPct} goal={row.goalPct} />

      <button
        type="button"
        className="flex h-10 shrink-0 items-center justify-center rounded-[16px] border border-[#dfe1e7] bg-white px-4 text-sm font-semibold tracking-[0.02em] text-[#0d47a1] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f3f7ff]"
      >
        Review ({row.reviewCount})
      </button>
      <Link
        to={`/app/analytics/drills?type=${encodeURIComponent(row.id)}`}
        className="ds-btn-sm shrink-0 rounded-[16px] text-sm tracking-[0.02em]"
      >
        Drill
      </Link>
    </div>
  )
}

export function SectionCard({ section }: { section: AnalyticsSection }) {
  return (
    <section className="mb-6 flex w-full flex-col gap-6 rounded-3xl border border-[#dfe1e7] bg-white p-6">
      <div className="flex items-center rounded-[16px] bg-[#f6f8fa] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-10 items-center justify-center rounded-[12px] border"
            style={{ backgroundColor: section.badgeBg, borderColor: section.badgeColor }}
          >
            <span
              className="text-xl font-black leading-[1.5] tracking-[0.02em]"
              style={{ color: section.badgeColor }}
            >
              {section.id}
            </span>
          </div>
          <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">{section.title}</h2>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex flex-col">
          {section.rows.map((row) => (
            <QuestionTypeRow key={row.id} row={row} accentBar={section.accentBar} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function ScoreProgressChart({ points, tab }: { points: ScoreProgressPoint[]; tab: ScoreProgressTab }) {
  if (points.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[#666d80]">Complete a PrepTest to see your score progress.</p>
    )
  }

  const minVal = Y_AXIS_LABELS[Y_AXIS_LABELS.length - 1]
  const maxVal = Y_AXIS_LABELS[0]
  const range = maxVal - minVal
  const stepX = 100 / points.length

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
    <div className="flex h-[300px] w-full items-stretch gap-4">
      <div className="flex h-full flex-col justify-between py-1 pr-2 text-sm font-medium text-[#062357]">
        {Y_AXIS_LABELS.map((label) => (
          <span key={label} className="leading-5">
            {label}
          </span>
        ))}
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
          {Y_AXIS_LABELS.map((label) => (
            <div key={label} className="h-px w-full bg-[#e5e7eb]" />
          ))}
        </div>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {showRegular ? (
            <>
              <polyline
                points={regularPolyline}
                fill="none"
                stroke="#0d47a1"
                strokeWidth="0.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <polygon
                points={`${regularPoints[0]!.x},100 ${regularPolyline} ${regularPoints[regularPoints.length - 1]!.x},100`}
                fill="#0d47a1"
                fillOpacity="0.08"
              />
            </>
          ) : null}
          {showBlind ? (
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
                  className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0d47a1]"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                />
              ))
            : null}
          {showBlind
            ? blindPoints.map((p, i) => (
                <span
                  key={`b-${i}`}
                  className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff6f00]"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                />
              ))
            : null}
        </div>
        <div className="absolute -bottom-7 left-0 right-0 flex justify-between gap-1 text-[11px] leading-4 text-[#062357] sm:text-xs">
          {points.map((p) => (
            <span key={p.test} className="min-w-0 flex-1 truncate text-center whitespace-nowrap">
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
}: {
  value: ScoreProgressTab
  onChange: (next: ScoreProgressTab) => void
}) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-[16px] bg-white p-1">
      {SCORE_PROGRESS_TABS.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex h-8 items-center justify-center rounded-[16px] px-3 text-sm font-semibold leading-[1.5] tracking-[0.02em] transition-colors",
              active ? "bg-[#0d47a1] text-white" : "text-[#666d80] hover:bg-[#f3f7ff]",
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
