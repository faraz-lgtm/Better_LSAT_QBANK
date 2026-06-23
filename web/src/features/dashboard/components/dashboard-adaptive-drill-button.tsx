import { DashboardAdaptiveDrillIcon } from "@/features/dashboard/components/dashboard-adaptive-drill-icon"
import { cn } from "@/lib/utils"

type DashboardAdaptiveDrillButtonProps = {
  loading?: boolean
  disabled?: boolean
  onClick: () => void
  className?: string
}

/** Figma `19274:32299` — dashboard header Adaptive Drill button */
function DashboardAdaptiveDrillButton({
  loading = false,
  disabled = false,
  onClick,
  className,
}: DashboardAdaptiveDrillButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-2 rounded-[12px] border border-[#0d47a1] bg-[#edf3ff] px-4 text-xs font-semibold leading-[1.5] tracking-[0.24px] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#e0ebff] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <DashboardAdaptiveDrillIcon className="size-4 shrink-0" />
      {loading ? "Starting…" : "Adaptive Drill"}
    </button>
  )
}

export { DashboardAdaptiveDrillButton }
