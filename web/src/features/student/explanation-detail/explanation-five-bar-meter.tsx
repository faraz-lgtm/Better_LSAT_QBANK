import { cn } from "@/lib/utils"

type ExplanationFiveBarMeterProps = {
  filled: number
  max?: number
  /** When set, filled segments use this color; empty uses light grey. */
  fillClassName: string
  emptyClassName?: string
  className?: string
}

function ExplanationFiveBarMeter({
  filled,
  max = 5,
  fillClassName,
  emptyClassName = "bg-[var(--slate-bar-empty)]",
  className,
}: ExplanationFiveBarMeterProps) {
  const safe = Math.max(0, Math.min(max, Math.round(filled)))
  return (
    <div className={cn("flex h-5 items-end gap-1.5", className)} role="img" aria-label={`${safe} of ${max} bars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={cn("h-full w-2 shrink-0 rounded-full", i < safe ? fillClassName : emptyClassName)} />
      ))}
    </div>
  )
}

export { ExplanationFiveBarMeter }
