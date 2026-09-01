import type { DashboardPerformanceOverview } from "@/features/dashboard/lib/map-dashboard-stats"
import { cn } from "@/lib/utils"

type PerformanceOverviewCardProps = {
  overview: DashboardPerformanceOverview
}

function PerformanceOverviewCard({ overview }: PerformanceOverviewCardProps) {
  return (
    <section className="min-w-0 rounded-[24px] border border-[#dfe1e7] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-[0.36px] text-[#062357]">Performance Overview</h2>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-[11px] font-medium text-[#0d47a1]">
            These score are predictive and differ for every student
          </p>
          <span className="rounded-full bg-[#dbeafe] px-2.5 py-1 text-[11px] font-medium text-[#0d47a1]">
            Across {overview.practiceTestCount} practice tests
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-[#dfe1e7] sm:grid-cols-4">
        {overview.metrics.map((metric) => (
          <div key={metric.id} className="flex min-w-0 flex-col gap-1.5 bg-white p-4">
            <p className="text-xs tracking-[0.24px] text-[#666d80]">{metric.label}</p>
            <p className={cn("text-2xl font-bold leading-[1.3] text-[#062357]", metric.valueClassName)}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export { PerformanceOverviewCard }
