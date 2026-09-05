import type { DashboardStatCard } from "@/features/dashboard/lib/map-dashboard-stats"

type DashboardQuickStatsProps = {
  cards: DashboardStatCard[]
}

function DashboardQuickStats({ cards }: DashboardQuickStatsProps) {
  return (
    <div className="dashboard-page__quick-stats grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <article
          key={card.id}
          className="flex min-h-[120px] flex-col justify-center rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{card.label}</p>
            <span className="size-3.5 shrink-0 overflow-hidden">
              <img src={card.iconSrc} alt="" className="size-full" width={14} height={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">{card.value}</p>
          <p className="mt-1 text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{card.caption}</p>
        </article>
      ))}
    </div>
  )
}

export { DashboardQuickStats }
