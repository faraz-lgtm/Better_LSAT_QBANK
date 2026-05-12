import { useEffect, useId, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Check, ChevronDown, Repeat2, Sparkles, SquarePlay, Target } from "lucide-react"

import type { PrepLessonStatus } from "@/features/admin/lib/prep-lesson-status"
import { cn } from "@/lib/utils"

const OPTIONS: Array<{
  value: PrepLessonStatus
  label: string
  description: string
  Icon: LucideIcon
}> = [
  {
    value: "video_text",
    label: "Video + text",
    description: "Video and rich text only — no PrepTest question links",
    Icon: SquarePlay,
  },
  {
    value: "active_drill",
    label: "Active Drill",
    description: "Link exactly one PrepTest question for the drill",
    Icon: Target,
  },
  {
    value: "adaptive_drill",
    label: "Adaptive Drill",
    description: "Link up to five PrepTest questions",
    Icon: Sparkles,
  },
  {
    value: "rep_work",
    label: "Rep work",
    description: "Instructions plus question and answer blocks you write here",
    Icon: Repeat2,
  },
]

type AdminLessonStatusDropdownProps = {
  value: PrepLessonStatus
  onChange: (value: PrepLessonStatus) => void
  disabled?: boolean
}

function AdminLessonStatusDropdown({ value, onChange, disabled }: AdminLessonStatusDropdownProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]
  const SelectedIcon = selected.Icon

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocMouseDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative min-w-[200px] max-w-[280px]">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "lesson-status-trigger flex w-full items-center gap-2 rounded-[10px] border border-[#dfe1e7] bg-white px-3 py-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors",
          "hover:border-[#c9cdd6] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/20",
          disabled && "pointer-events-none opacity-50",
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#f6f8fa] text-[var(--accent)]">
          <SelectedIcon className="size-[18px]" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold leading-5 tracking-[0.02em] text-[#1a1b25]">
            {selected.label}
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-[#666d80] transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-full min-w-[260px] overflow-hidden rounded-[10px] border border-[#dfe1e7] bg-white py-1 shadow-[0_10px_24px_rgba(13,13,18,0.08)]"
        >
          {OPTIONS.map((opt) => {
            const active = opt.value === value
            const OptIcon = opt.Icon
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                    active ? "bg-[#f3f7ff]" : "hover:bg-[#f6f8fa]",
                  )}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#f6f8fa] text-[var(--accent)]">
                    <OptIcon className="size-[18px]" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold leading-5 tracking-[0.02em] text-[#1a1b25]">
                        {opt.label}
                      </span>
                      {active && <Check className="size-4 shrink-0 text-[var(--accent)]" aria-hidden />}
                    </span>
                    <span className="mt-0.5 block text-[12px] font-normal leading-4 text-[#666d80]">
                      {opt.description}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export { AdminLessonStatusDropdown }
