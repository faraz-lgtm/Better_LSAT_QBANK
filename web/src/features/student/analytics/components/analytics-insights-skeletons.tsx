import { cn } from "@/lib/utils"

export function AnalyticsSkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-[var(--greyscale-100)]", className)} />
}

export function AnalyticsStatsSkeleton({
  headlineCount = 2,
  secondaryCount = 4,
  label = "Loading stats",
}: {
  headlineCount?: number
  secondaryCount?: number
  label?: string
}) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label={label}>
      {headlineCount > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: headlineCount }, (_, i) => (
            <article
              key={`headline-skel-${i}`}
              className="flex min-h-[120px] flex-col justify-center gap-2 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-5"
            >
              <AnalyticsSkeletonBlock className="h-3 w-24" />
              <AnalyticsSkeletonBlock className="h-8 w-16" />
              <AnalyticsSkeletonBlock className="h-3 w-28" />
            </article>
          ))}
        </div>
      ) : null}
      {secondaryCount > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: secondaryCount }, (_, i) => (
            <article
              key={`secondary-skel-${i}`}
              className="flex min-h-[96px] flex-col justify-center gap-2 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-4"
            >
              <AnalyticsSkeletonBlock className="h-3 w-20" />
              <AnalyticsSkeletonBlock className="h-6 w-12" />
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AnalyticsChartSkeleton({ label = "Loading score chart" }: { label?: string }) {
  return (
    <section
      className="flex flex-col gap-4 overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-4 shadow-[0px_1px_2px_rgba(13,13,18,0.04)]"
      aria-busy="true"
      aria-label={label}
    >
      <AnalyticsSkeletonBlock className="h-5 w-48" />
      <AnalyticsSkeletonBlock className="h-[220px] w-full rounded-[12px]" />
      <div className="flex gap-4">
        <AnalyticsSkeletonBlock className="h-4 w-28" />
        <AnalyticsSkeletonBlock className="h-4 w-32" />
      </div>
    </section>
  )
}

export function AnalyticsHistorySkeleton({
  rows = 3,
  label = "Loading history",
}: {
  rows?: number
  label?: string
}) {
  return (
    <section
      className="flex flex-col overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_2px_rgba(13,13,18,0.04)]"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-[var(--greyscale-100)] px-4 py-3">
        <AnalyticsSkeletonBlock className="h-4 w-28" />
        <div className="flex items-center gap-2">
          <AnalyticsSkeletonBlock className="h-8 w-16 rounded-[10px]" />
          <AnalyticsSkeletonBlock className="h-8 w-24 rounded-[10px]" />
        </div>
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={`history-skel-${i}`}
          className="flex flex-col gap-2 border-t border-[var(--greyscale-100)] px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <AnalyticsSkeletonBlock className="size-8 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <AnalyticsSkeletonBlock className="h-4 w-40 max-w-full" />
              <AnalyticsSkeletonBlock className="h-3 w-28 max-w-full" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AnalyticsSkeletonBlock className="h-10 w-24 rounded-[10px]" />
            <AnalyticsSkeletonBlock className="h-10 w-28 rounded-[10px]" />
            <AnalyticsSkeletonBlock className="size-7 rounded-[6px]" />
          </div>
        </div>
      ))}
    </section>
  )
}

export function AnalyticsDrillsHeroSkeleton() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-[minmax(240px,360px)_1fr] lg:items-stretch"
      aria-busy="true"
      aria-label="Loading drill analytics"
    >
      <div className="grid h-full grid-cols-2 gap-3" aria-label="Loading drill stats">
        {Array.from({ length: 4 }, (_, i) => (
          <article
            key={`drill-stat-skel-${i}`}
            className="flex min-h-[88px] min-w-0 flex-col justify-center gap-2 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 py-3.5 shadow-[0px_1px_2px_rgba(13,13,18,0.04)]"
          >
            <AnalyticsSkeletonBlock className="h-3 w-20" />
            <AnalyticsSkeletonBlock className="h-7 w-14" />
          </article>
        ))}
      </div>
      <section
        className="flex h-full min-h-[200px] w-full flex-col gap-[18px] rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6"
        aria-label="Loading drill chart"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AnalyticsSkeletonBlock className="h-5 w-32" />
          <div className="flex gap-1.5">
            <AnalyticsSkeletonBlock className="h-8 w-20 rounded-[10px]" />
            <AnalyticsSkeletonBlock className="h-8 w-36 rounded-[10px]" />
          </div>
        </div>
        <AnalyticsSkeletonBlock className="min-h-[220px] w-full flex-1 rounded-[12px]" />
      </section>
    </div>
  )
}
