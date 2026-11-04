import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LockedMetricSkeleton } from "@/features/student/components/locked-metric-skeleton"
import { cn } from "@/lib/utils"

export type AnalyticsInsightsFreePreviewVariant = "overview" | "drills" | "sections" | "preptests"

type AnalyticsInsightsFreePreviewProps = {
  variant: AnalyticsInsightsFreePreviewVariant
  onLockedAction: () => void
}

const OVERVIEW_HEADLINE = [
  { id: "best-score", label: "Best Score", skeletonWidthClass: "w-16" },
  { id: "average-score", label: "Average Score", skeletonWidthClass: "w-16" },
] as const

const OVERVIEW_SECONDARY = [
  { id: "avg-lr", label: "Logical Reasoning Average", skeletonWidthClass: "w-12" },
  { id: "avg-rc", label: "Reading Comprehension Average", skeletonWidthClass: "w-12" },
  { id: "avg-time", label: "Average Time per Question", skeletonWidthClass: "w-14" },
  { id: "accuracy", label: "Question Accuracy", skeletonWidthClass: "w-12" },
] as const

const DRILLS_STATS = [
  { id: "avg-score", label: "Avg Score", skeletonWidthClass: "w-14" },
  { id: "accuracy", label: "Accuracy", skeletonWidthClass: "w-12" },
  { id: "questions", label: "Questions", skeletonWidthClass: "w-14" },
  { id: "avg-time", label: "Avg Time / Q", skeletonWidthClass: "w-12" },
] as const

const SECTIONS_STATS = [
  { id: "avg-correct", label: "Avg Correct", skeletonWidthClass: "w-14" },
  { id: "avg-score", label: "Avg Score", skeletonWidthClass: "w-12" },
  { id: "sections-done", label: "Sections Done", skeletonWidthClass: "w-14" },
  { id: "avg-time", label: "Avg Time", skeletonWidthClass: "w-12" },
] as const

const PREPTEST_STATS = [
  { id: "best-score", label: "Best Score", skeletonWidthClass: "w-14" },
  { id: "avg-score", label: "Avg Score", skeletonWidthClass: "w-12" },
  { id: "tests-done", label: "PrepTests Done", skeletonWidthClass: "w-14" },
  { id: "percentile", label: "Percentile", skeletonWidthClass: "w-12" },
] as const

const PAGE_COPY: Record<
  AnalyticsInsightsFreePreviewVariant,
  { title: string; chartTitle: string; historyTitle: string }
> = {
  overview: {
    title: "Overview",
    chartTitle: "Test Performance History",
    historyTitle: "Practice History",
  },
  drills: {
    title: "Drills",
    chartTitle: "Drill Score Progress",
    historyTitle: "Drill History",
  },
  sections: {
    title: "Sections",
    chartTitle: "Section Trajectory",
    historyTitle: "Section History",
  },
  preptests: {
    title: "PrepTest",
    chartTitle: "Exam Trajectory",
    historyTitle: "PrepTest History",
  },
}

function InsightsUpgradeBanner({ onUnlock }: { onUnlock: () => void }) {
  return (
    <section className="flex w-full flex-col gap-[18px] rounded-[20px] border border-[var(--primary)] bg-[var(--greyscale-0)] px-[22px] py-[18px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)] sm:flex-row sm:items-center">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--primary-25)]">
        <Lock className="size-5 text-[var(--primary)]" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold leading-6 text-[var(--color-student-heading)]">
          Unlock full analytics
        </p>
        <p className="text-base leading-[1.5] tracking-[0.32px] text-[var(--greyscale-500)]">
          Track accuracy, timing, and performance patterns so you know what to work on next.
        </p>
      </div>
      <Button
        type="button"
        className="h-10 shrink-0 rounded-[14px] border border-[var(--primary-border)] px-4 text-sm font-semibold tracking-[0.28px] shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
        onClick={onUnlock}
      >
        Unlock Analytics
      </Button>
    </section>
  )
}

function LockedStatCard({
  label,
  skeletonWidthClass,
  large = false,
}: {
  label: string
  skeletonWidthClass: string
  large?: boolean
}) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_2px_rgba(13,13,18,0.04)]",
        large ? "min-h-[148px] justify-between gap-3 p-5" : "gap-1 px-4 py-3.5",
      )}
    >
      <p
        className={cn(
          "m-0 font-semibold leading-[1.4] text-[var(--color-student-heading)]",
          large ? "text-sm tracking-[0.01em]" : "text-[11px] tracking-[0.02em]",
        )}
      >
        {label}
      </p>
      <LockedMetricSkeleton
        widthClass={skeletonWidthClass}
        className={large ? "h-10" : undefined}
      />
    </article>
  )
}

function LockedChartPanel({ title }: { title: string }) {
  return (
    <section className="w-full rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-5">
      <h2 className="m-0 text-base font-bold leading-[1.3] text-[var(--color-student-heading)]">{title}</h2>
      <div className="mt-4 flex h-[180px] flex-col justify-end gap-3 sm:h-[220px]">
        <LockedMetricSkeleton widthClass="w-full" className="h-24 sm:h-32" />
        <div className="flex gap-3">
          <LockedMetricSkeleton widthClass="w-20" className="h-3" />
          <LockedMetricSkeleton widthClass="w-24" className="h-3" />
        </div>
      </div>
    </section>
  )
}

function LockedHistoryPanel({ title }: { title: string }) {
  return (
    <section className="w-full rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-5">
      <h2 className="m-0 text-base font-bold leading-[1.3] text-[var(--color-student-heading)]">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={`locked-history-${index}`}
            className="flex items-center justify-between gap-4 rounded-[14px] border border-[var(--greyscale-100)] px-4 py-3"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <LockedMetricSkeleton widthClass="w-40" className="h-4" />
              <LockedMetricSkeleton widthClass="w-24" className="h-3" />
            </div>
            <LockedMetricSkeleton widthClass="w-12" className="h-6" />
          </div>
        ))}
      </div>
    </section>
  )
}

function statsForVariant(variant: AnalyticsInsightsFreePreviewVariant) {
  if (variant === "drills") return DRILLS_STATS
  if (variant === "sections") return SECTIONS_STATS
  if (variant === "preptests") return PREPTEST_STATS
  return OVERVIEW_SECONDARY
}

/** Free-plan Insights browse — real chrome, empty blurred metrics, upgrade modal on interact. */
function AnalyticsInsightsFreePreview({
  variant,
  onLockedAction,
}: AnalyticsInsightsFreePreviewProps) {
  const copy = PAGE_COPY[variant]
  const gridStats = statsForVariant(variant)

  return (
    <div
      className="flex flex-col gap-6 pb-8"
      data-testid="analytics-insights-free-preview"
      data-variant={variant}
    >
      <InsightsUpgradeBanner onUnlock={onLockedAction} />

      <button
        type="button"
        className="flex w-full cursor-pointer flex-col gap-6 rounded-[8px] border-0 bg-transparent p-0 text-left"
        aria-label={`Unlock ${copy.title} analytics`}
        onClick={onLockedAction}
      >
        <section className="flex w-full flex-col gap-4">
          <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-bold leading-[1.3] text-[var(--color-student-heading)]">
              {copy.title}
            </h2>
            <span className="rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3.5 py-2 text-[11px] font-semibold tracking-[0.02em] text-[var(--greyscale-500)]">
              All time
            </span>
          </div>

          {variant === "overview" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {OVERVIEW_HEADLINE.map((stat) => (
                  <LockedStatCard
                    key={stat.id}
                    label={stat.label}
                    skeletonWidthClass={stat.skeletonWidthClass}
                    large
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {OVERVIEW_SECONDARY.map((stat) => (
                  <LockedStatCard
                    key={stat.id}
                    label={stat.label}
                    skeletonWidthClass={stat.skeletonWidthClass}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {gridStats.map((stat) => (
                <LockedStatCard
                  key={stat.id}
                  label={stat.label}
                  skeletonWidthClass={stat.skeletonWidthClass}
                />
              ))}
            </div>
          )}
        </section>

        <LockedChartPanel title={copy.chartTitle} />
        <LockedHistoryPanel title={copy.historyTitle} />
      </button>
    </div>
  )
}

export { AnalyticsInsightsFreePreview }
