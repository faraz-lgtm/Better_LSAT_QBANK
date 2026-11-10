import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  STUDENT_DIAGNOSTIC_HREF,
  STUDENT_FREE_STRATEGY_CALL_HREF,
} from "@/features/app-shell/student-nav-config"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import {
  OVERVIEW_TIME_RANGE_OPTIONS,
  TimeRangeSegmented,
} from "@/features/student/components/time-range-filter"
import { cn } from "@/lib/utils"

export type AnalyticsInsightsFreePreviewVariant = "overview" | "drills" | "sections" | "preptests"

type AnalyticsInsightsFreePreviewProps = {
  variant: AnalyticsInsightsFreePreviewVariant
  onLockedAction: () => void
}

const INSIGHTS_OVERVIEW_FIGMA = "/figma/insights-overview" as const

const OVERVIEW_HEADLINE = [
  { id: "best-score", label: "Best Score", showBar: true },
  { id: "average-score", label: "Avg Score", showBar: true },
] as const

const OVERVIEW_SECONDARY = [
  { id: "avg-lr", label: "Logical Reasoning Mean" },
  { id: "avg-rc", label: "Reading Comprehension Mean" },
  { id: "avg-time", label: "Avg Time per Question" },
  { id: "accuracy", label: "Question Accuracy" },
] as const

const DRILLS_EMPTY_STATS = [
  { id: "drills-mean", label: "Drills Mean" },
  { id: "accuracy", label: "Accuracy" },
  { id: "question-drilled", label: "Question Drilled" },
  { id: "question-accuracy", label: "Question Accuracy" },
] as const

const SECTIONS_EMPTY_STATS = [
  { id: "peak-performance", label: "Peak Performance" },
  { id: "trailing-average", label: "Trailing Average" },
  { id: "accuracy", label: "Accuracy" },
  { id: "momentum", label: "Momentum" },
] as const

const PREPTEST_EMPTY_STATS = [
  { id: "peak-score", label: "Peak Score" },
  { id: "target-gap", label: "Target Gap" },
  { id: "score-variance", label: "Score Variance" },
  { id: "section-drop-off", label: "Section Drop-off" },
] as const

const SECTION_KIND_CARDS = [
  { id: "LR" as const, title: "Logical Reasoning", selected: true },
  { id: "RC" as const, title: "Reading Comprehension", selected: false },
]

function EmptyOverviewStatCard({
  label,
  showBar = false,
}: {
  label: string
  showBar?: boolean
}) {
  return (
    <article className="flex min-w-0 flex-col gap-[5px] rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6">
      <p className="m-0 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#64748b]">{label}</p>
      <p className="m-0 text-[32px] font-black leading-[1.25] text-[var(--greyscale-100)]" aria-hidden>
        ---
      </p>
      {showBar ? (
        <div className="flex h-[30px] items-center pt-2">
          <div className="h-2.5 w-[120px] rounded-[8px] bg-[var(--greyscale-100)]" aria-hidden />
        </div>
      ) : null}
    </article>
  )
}

/** Figma `21711:30401` — empty-state CTA inside the overview card. */
function OverviewEmptyPracticePanel() {
  return (
    <section className="flex w-full flex-col items-center gap-3 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-8 py-14">
      <div className="flex size-14 items-center justify-center rounded-[14px] bg-[#e4ecfb]">
        <img
          src={`${INSIGHTS_OVERVIEW_FIGMA}/empty-chart-icon.svg`}
          alt=""
          width={28}
          height={28}
          className="size-7 max-w-none shrink-0"
          draggable={false}
        />
      </div>
      <h3 className="m-0 text-center text-xl font-bold leading-normal text-[#0b1f4d]">
        Start practicing to see your data
      </h3>
      <p className="m-0 max-w-[460px] text-center text-sm leading-[21px] text-[#475569]">
        Your scores, section averages and performance history will appear here once you complete a
        diagnostic, drill, section or PrepTest.
      </p>
      <div className="flex flex-col items-stretch gap-3 pt-4 sm:flex-row sm:items-center sm:justify-center">
        <Button asChild className="h-12 rounded-[14px] px-4 text-base font-semibold tracking-[0.32px]">
          <Link to={STUDENT_DIAGNOSTIC_HREF}>Take the Diagnostic Test</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-[14px] border-[var(--greyscale-100)] px-4 text-base font-semibold tracking-[0.32px] text-[var(--primary)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] hover:text-white"
        >
          <Link to={STUDENT_FREE_STRATEGY_CALL_HREF}>Book Your Free 15-Minute Call</Link>
        </Button>
      </div>
    </section>
  )
}

function InsightsFreePreviewHeader({ title }: { title: string }) {
  return (
    <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3">
      <h2 className="m-0 text-lg font-semibold leading-[1.4] tracking-[0.36px] text-[var(--color-student-heading)]">
        {title}
      </h2>
      <div className="pointer-events-none opacity-40" aria-hidden>
        <TimeRangeSegmented
          value="all"
          onChange={() => undefined}
          options={OVERVIEW_TIME_RANGE_OPTIONS}
        />
      </div>
    </div>
  )
}

/** Figma `21711:31578` — static LR/RC empty switcher (LR selected). */
function SectionsEmptyKindSwitcher() {
  return (
    <div className="grid gap-6 md:grid-cols-2" aria-hidden>
      {SECTION_KIND_CARDS.map((card) => (
        <div
          key={card.id}
          className={cn(
            "flex flex-col items-start rounded-[18px] border border-solid p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]",
            card.selected
              ? "border-[var(--primary)] bg-[var(--primary-25)]"
              : "border-[var(--greyscale-100)] bg-[var(--greyscale-0)]",
          )}
        >
          <div className="flex items-center gap-3">
            <SectionInitialBadge section={card.id} variant="compact" />
            <span className="text-base font-semibold leading-[1.35] text-[#64748b]">{card.title}</span>
          </div>
          <p className="m-0 mt-1.5 pl-11 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[var(--greyscale-100)]">
            ---
          </p>
        </div>
      ))}
    </div>
  )
}

/** Figma `21710:26227` — free Insights Overview empty state. */
function OverviewInsightsFreePreview() {
  return (
    <div
      className="flex flex-col gap-6 pb-8"
      data-testid="analytics-insights-free-preview"
      data-variant="overview"
    >
      <InsightsFreePreviewHeader title="Overview" />

      <div className="flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          {OVERVIEW_HEADLINE.map((stat) => (
            <EmptyOverviewStatCard key={stat.id} label={stat.label} showBar={stat.showBar} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {OVERVIEW_SECONDARY.map((stat) => (
            <EmptyOverviewStatCard key={stat.id} label={stat.label} />
          ))}
        </div>

        <OverviewEmptyPracticePanel />
      </div>
    </div>
  )
}

/** Figma `21711:30432` — free Insights Drills empty state. */
function DrillsInsightsFreePreview() {
  return (
    <div
      className="flex flex-col gap-6 pb-8"
      data-testid="analytics-insights-free-preview"
      data-variant="drills"
    >
      <InsightsFreePreviewHeader title="Drills" />

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {DRILLS_EMPTY_STATS.map((stat) => (
            <EmptyOverviewStatCard key={stat.id} label={stat.label} />
          ))}
        </div>

        <OverviewEmptyPracticePanel />
      </div>
    </div>
  )
}

/** Figma `21711:31565` — free Insights Sections empty state. */
function SectionsInsightsFreePreview() {
  return (
    <div
      className="flex flex-col gap-6 pb-8"
      data-testid="analytics-insights-free-preview"
      data-variant="sections"
    >
      <InsightsFreePreviewHeader title="Section Insights" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          <SectionsEmptyKindSwitcher />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
            {SECTIONS_EMPTY_STATS.map((stat) => (
              <EmptyOverviewStatCard key={stat.id} label={stat.label} />
            ))}
          </div>
        </div>

        <OverviewEmptyPracticePanel />
      </div>
    </div>
  )
}

/** Figma `21711:31405` — free Insights PrepTests empty state. */
function PrepTestsInsightsFreePreview() {
  return (
    <div
      className="flex flex-col gap-6 pb-8"
      data-testid="analytics-insights-free-preview"
      data-variant="preptests"
    >
      <InsightsFreePreviewHeader title="PrepTest Insights" />

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {PREPTEST_EMPTY_STATS.map((stat) => (
            <EmptyOverviewStatCard key={stat.id} label={stat.label} />
          ))}
        </div>

        <OverviewEmptyPracticePanel />
      </div>
    </div>
  )
}

/** Free-plan Insights browse — empty-state previews for all Insights tabs. */
function AnalyticsInsightsFreePreview({
  variant,
}: AnalyticsInsightsFreePreviewProps) {
  if (variant === "overview") {
    return <OverviewInsightsFreePreview />
  }

  if (variant === "drills") {
    return <DrillsInsightsFreePreview />
  }

  if (variant === "sections") {
    return <SectionsInsightsFreePreview />
  }

  return <PrepTestsInsightsFreePreview />
}

export { AnalyticsInsightsFreePreview }
