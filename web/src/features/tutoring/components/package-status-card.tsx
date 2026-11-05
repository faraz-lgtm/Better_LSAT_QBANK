import type { ActivePackageSummary, PackageSlotStatus } from "@/features/tutoring/lib/types"
import { cn } from "@/lib/utils"

type PackageStatusCardProps = {
  packageSummary: ActivePackageSummary
}

const SLOT_CLASS: Record<PackageSlotStatus, string> = {
  completed: "bg-[#00bc54]",
  scheduled: "bg-[var(--primary)]",
  unscheduled: "bg-[#d5deec]",
}

function PackageStatusCard({ packageSummary }: PackageStatusCardProps) {
  return (
    <section className="flex w-full flex-col gap-3.5 rounded-[16px] border border-[#e4e9f2] bg-[var(--greyscale-0)] p-5 lg:max-w-[280px]">
      <p className="text-xs font-bold tracking-[0.02em] text-[var(--primary)]">YOUR PACKAGE</p>
      <div>
        <h2 className="text-[20px] font-bold leading-[1.35] text-[var(--color-student-heading)]">
          {packageSummary.name}
        </h2>
        <p className="mt-1 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
          {packageSummary.purchasedLabel}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-1.5" aria-label="Package session progress">
        {packageSummary.slots.map((status, index) => (
          <div
            key={`${status}-${index}`}
            className={cn("h-2.5 rounded-full", SLOT_CLASS[status])}
            title={status}
          />
        ))}
      </div>

      <ul className="space-y-2">
        <li className="flex items-center gap-2 text-xs tracking-[0.02em] text-[var(--color-student-heading)]">
          <span className="size-2.5 rounded-[3px] bg-[#00bc54]" aria-hidden />
          <span className="flex-1">Completed</span>
          <span className="font-bold">{packageSummary.completed}</span>
        </li>
        <li className="flex items-center gap-2 text-xs tracking-[0.02em] text-[var(--color-student-heading)]">
          <span className="size-2.5 rounded-[3px] bg-[var(--primary)]" aria-hidden />
          <span className="flex-1">Scheduled</span>
          <span className="font-bold">{packageSummary.scheduled}</span>
        </li>
        <li className="flex items-center gap-2 text-xs tracking-[0.02em] text-[var(--color-student-heading)]">
          <span className="size-2.5 rounded-[3px] bg-[#d5deec]" aria-hidden />
          <span className="flex-1">Not scheduled</span>
          <span className="font-bold">{packageSummary.notScheduled}</span>
        </li>
      </ul>
    </section>
  )
}

export { PackageStatusCard }
