import { cn } from "@/lib/utils"

type ReviewAnalysisSwitchProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function ReviewAnalysisSwitch({ checked, onCheckedChange }: ReviewAnalysisSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Analysis View"
      onClick={() => onCheckedChange(!checked)}
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]/30",
        checked ? "bg-[var(--primary)]" : "bg-[var(--greyscale-300)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-[var(--greyscale-0)] shadow-sm transition-transform dark:bg-[var(--greyscale-900)]",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  )
}

export type ReviewPassageCardHeaderProps = {
  /** When true, Analysis View is shown for available review analysis/explanation content. */
  analysisEnabled?: boolean
  analysisChecked?: boolean
  onAnalysisCheckedChange?: (checked: boolean) => void
}

/** Review-tester passage chrome: Analysis View switch. */
export function ReviewPassageCardHeader({
  analysisEnabled = false,
  analysisChecked = false,
  onAnalysisCheckedChange,
}: ReviewPassageCardHeaderProps) {
  if (!analysisEnabled) return null

  return (
    <div className="mb-8 flex h-8 shrink-0 items-center justify-end gap-4">
      <span className="inline-flex h-8 items-center gap-4">
        <span className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">
          Analysis View
        </span>
        <ReviewAnalysisSwitch
          checked={analysisChecked}
          onCheckedChange={(next) => onAnalysisCheckedChange?.(next)}
        />
      </span>
    </div>
  )
}
