import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export type StudentMultiOptionMenuOption<T extends string> = {
  value: T
  label: string
}

type StudentMultiOptionMenuVariant = "default" | "surface"

const closedTriggerClass: Record<StudentMultiOptionMenuVariant, string> = {
  default:
    "border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--color-student-heading)] hover:border-[color:var(--primary-100)]",
  surface:
    "border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--color-student-heading)] hover:border-[color:var(--primary-100)]",
}

type StudentMultiOptionMenuProps<T extends string> = {
  values: readonly T[]
  onChange: (next: T[]) => void
  options: readonly StudentMultiOptionMenuOption<T>[]
  ariaLabel: string
  emptyLabel?: string
  className?: string
  triggerClassName?: string
  menuAlign?: "left" | "right"
  size?: "default" | "lg"
  variant?: StudentMultiOptionMenuVariant
}

function StudentMultiOptionMenu<T extends string>({
  values,
  onChange,
  options,
  ariaLabel,
  emptyLabel = "Select",
  className,
  triggerClassName,
  menuAlign = "left",
  size = "default",
  variant = "default",
}: StudentMultiOptionMenuProps<T>) {
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

  const selectedSet = new Set(values)
  const activeLabels = options.filter((option) => selectedSet.has(option.value)).map((option) => option.label)
  const activeLabel =
    activeLabels.length === 0
      ? emptyLabel
      : activeLabels.length <= 3
        ? activeLabels.join(", ")
        : `${activeLabels.length} selected`

  function toggleValue(next: T) {
    if (selectedSet.has(next)) {
      onChange(values.filter((value) => value !== next))
      return
    }
    onChange([...values, next])
  }

  return (
    <div ref={containerRef} className={cn("relative w-full min-w-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        className={cn(
          "flex w-full min-w-[140px] items-center gap-2 border px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/30",
          size === "lg"
            ? "h-[52px] rounded-[16px] text-base font-normal tracking-[0.32px]"
            : "h-10 rounded-[10px] text-sm font-medium",
          open
            ? "border-[var(--primary)] bg-[var(--primary-25)] font-medium text-[var(--color-student-heading)]"
            : closedTriggerClass[variant],
          triggerClassName,
        )}
      >
        <span className="flex-1 truncate text-left">{activeLabel}</span>
        <ChevronDown
          className={cn(
            "shrink-0 text-[var(--greyscale-500)] transition-transform",
            size === "lg" ? "size-5" : "size-4",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={ariaLabel}
          className={cn(
            "absolute z-30 mt-2 flex max-h-[min(24rem,calc(100vh-8rem))] w-full max-w-full flex-col gap-1 overflow-y-auto border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-2 shadow-[0px_12px_24px_rgba(13,13,18,0.12)]",
            size === "lg" ? "rounded-[12px]" : "rounded-[10px]",
            menuAlign === "right" ? "right-0" : "left-0",
          )}
        >
          {options.map((option) => {
            const active = selectedSet.has(option.value)
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => toggleValue(option.value)}
                  className={cn(
                    "flex w-full min-w-0 items-start justify-between gap-3 px-3 py-3 font-medium tracking-[0.02em] transition-colors",
                    size === "lg"
                      ? "min-h-[44px] rounded-[8px] text-base font-normal tracking-[0.32px]"
                      : "min-h-10 rounded-[8px] text-sm",
                    active
                      ? "bg-[var(--primary-25)] text-[var(--color-student-heading)]"
                      : "text-[var(--color-student-heading)] hover:bg-[color:var(--primary-25)]/60",
                  )}
                >
                  <span className="min-w-0 flex-1 whitespace-normal text-left leading-snug">
                    {option.label}
                  </span>
                  {active ? (
                    <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export { StudentMultiOptionMenu }
