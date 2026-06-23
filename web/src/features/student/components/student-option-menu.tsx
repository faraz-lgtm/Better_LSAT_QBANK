import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export type StudentOptionMenuOption<T extends string> = {
  value: T
  label: string
}

type StudentOptionMenuProps<T extends string> = {
  value: T
  onChange: (next: T) => void
  options: readonly StudentOptionMenuOption<T>[]
  ariaLabel: string
  className?: string
  menuAlign?: "left" | "right"
}

function StudentOptionMenu<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  menuAlign = "left",
}: StudentOptionMenuProps<T>) {
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

  const activeLabel = options.find((option) => option.value === value)?.label ?? "Select"

  function handleSelect(next: T) {
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
        className={cn(
          "flex h-10 w-full min-w-[140px] items-center gap-2 rounded-[10px] border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d47a1]/30",
          open
            ? "border-[#0d47a1] bg-[#f3f7ff] text-[#0d47a1]"
            : "border-[#dfe1e7] bg-white text-[#062357] hover:bg-[#f3f7ff]",
        )}
      >
        <span className="flex-1 truncate text-left">{activeLabel}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", open ? "rotate-180 text-[#0d47a1]" : "text-[#0d47a1]")}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "absolute z-30 mt-2 min-w-full overflow-hidden rounded-[10px] border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]",
            menuAlign === "right" ? "right-0" : "left-0",
          )}
        >
          {options.map((option) => {
            const active = option.value === value
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex h-10 w-full items-center justify-between gap-3 rounded-[10px] px-3 text-sm font-medium tracking-[0.02em] transition-colors",
                    active ? "bg-[#f3f7ff] text-[#0d47a1]" : "text-[#062357] hover:bg-[#f6f8fa]",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {active ? <Check className="size-4 shrink-0" aria-hidden /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export { StudentOptionMenu }
