import { cn } from "@/lib/utils"

/** Empty blurred bar — no metric text in the DOM (real or fake). */
function LockedMetricSkeleton({
  widthClass,
  className,
}: {
  widthClass: string
  className?: string
}) {
  return (
    <div className={cn("h-8 blur-[7px] select-none", widthClass, className)} aria-hidden data-testid="locked-metric-skeleton">
      <div className="h-full w-full rounded-md bg-[var(--primary-800,#041a44)]/35" />
    </div>
  )
}

export { LockedMetricSkeleton }
