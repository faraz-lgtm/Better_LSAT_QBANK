import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export type TimeRangeValue = "7d" | "30d" | "90d" | "ytd" | "all"

export type TimeRangeOption = {
  value: TimeRangeValue
  label: string
}

export const TIME_RANGE_OPTIONS: readonly TimeRangeOption[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "ytd", label: "This Year" },
  { value: "all", label: "All Time" },
] as const

export function getTimeRangeLabel(value: TimeRangeValue): string {
  return TIME_RANGE_OPTIONS.find((option) => option.value === value)?.label ?? "All Time"
}

/**
 * Returns the number of most-recent points to keep for a given range when
 * filtering a series of equally-spaced datapoints. Used to give immediate
 * visual feedback in mock-data charts and history lists.
 */
export function getTimeRangeWindow(value: TimeRangeValue, total: number): number {
  if (total <= 0) return 0
  switch (value) {
    case "7d":
      return Math.max(1, Math.ceil(total * 0.2))
    case "30d":
      return Math.max(2, Math.ceil(total * 0.4))
    case "90d":
      return Math.max(3, Math.ceil(total * 0.65))
    case "ytd":
      return Math.max(4, Math.ceil(total * 0.85))
    case "all":
    default:
      return total
  }
}

export function takeLastByTimeRange<T>(items: readonly T[], value: TimeRangeValue): T[] {
  const window = getTimeRangeWindow(value, items.length)
  return items.slice(items.length - window)
}

type TimeRangeFilterProps = {
  value: TimeRangeValue
  onChange: (next: TimeRangeValue) => void
  className?: string
  ariaLabel?: string
}

function TimeRangeFilter({
  value,
  onChange,
  className,
  ariaLabel = "Filter by time range",
}: TimeRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const listboxId = useId()

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (containerRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  function handleSelect(next: TimeRangeValue) {
    onChange(next)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        className="flex h-[52px] w-[160px] items-center gap-2 rounded-2xl border border-[#dfe1e7] bg-white px-3 text-base font-medium text-[#666d80] transition-colors hover:bg-[#f3f7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d47a1]/30"
      >
        <span className="flex-1 text-left">{getTimeRangeLabel(value)}</span>
        <ChevronDown
          className={cn("size-5 transition-transform", open ? "rotate-180" : "")}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 z-30 mt-2 min-w-[200px] overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
        >
          {TIME_RANGE_OPTIONS.map((option) => {
            const active = option.value === value
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium tracking-[0.02em] transition-colors",
                    active ? "bg-[#f3f7ff] text-[#0d47a1]" : "text-[#062357] hover:bg-[#f6f8fa]",
                  )}
                >
                  <span>{option.label}</span>
                  {active ? <Check className="size-4" aria-hidden /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export { TimeRangeFilter }
