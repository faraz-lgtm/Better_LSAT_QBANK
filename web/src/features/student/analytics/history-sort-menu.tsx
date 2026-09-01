import { useEffect, useRef, useState } from "react"
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react"

import {
  HISTORY_SORT_OPTIONS,
  type HistorySort,
} from "@/features/student/analytics/history-sort"
import { cn } from "@/lib/utils"

type HistorySortMenuProps = {
  value: HistorySort
  onChange: (next: HistorySort) => void
  ariaLabel?: string
}

function HistorySortMenu({
  value,
  onChange,
  ariaLabel = "Sort history",
}: HistorySortMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (containerRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  const activeLabel = HISTORY_SORT_OPTIONS.find((option) => option.id === value)?.label ?? "Sort"
  const Icon = value.endsWith("desc") ? ArrowDownAZ : ArrowUpAZ

  return (
    <div ref={containerRef} className="relative z-20">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 items-center gap-2 rounded-[16px] border border-[#dfe1e7] bg-white px-3 text-sm font-semibold text-[#062357] hover:bg-[#f3f7ff]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <Icon className="size-4 text-[#666d80]" aria-hidden />
        <span>{activeLabel}</span>
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 z-30 mt-2 min-w-[200px] overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {HISTORY_SORT_OPTIONS.map((option) => {
            const active = option.id === value
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex h-10 w-full items-center rounded-[16px] px-3 text-sm font-medium tracking-[0.02em] transition-colors",
                    active ? "bg-[#f3f7ff] text-[#0d47a1]" : "text-[#062357] hover:bg-[#f6f8fa]",
                  )}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export { HistorySortMenu }
