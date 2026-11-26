import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export type AdminStudentsFilterOption = {
  value: string
  label: string
  description?: string
  count?: number
  dotColor?: string
   dividerAfter?: boolean
}

type AdminStudentsFilterDropdownProps = {
  id?: string
  /** Uppercase field label above the closed trigger (e.g. PLAN). */
  fieldLabel: string
  /** Uppercase title inside the open menu (e.g. FILTER BY PLAN). */
  menuTitle: string
  value: string
  onChange: (value: string) => void
  options: AdminStudentsFilterOption[]
  className?: string
  /** Preferred menu width in px; defaults to hugging content with a floor. */
  menuWidth?: number
  disabled?: boolean
}

function AdminStudentsFilterDropdown({
  id,
  fieldLabel,
  menuTitle,
  value,
  onChange,
  options,
  className,
  menuWidth,
  disabled = false,
}: AdminStudentsFilterDropdownProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value) ?? options[0]
  const triggerLabel = selected?.label ?? "Select"

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (rootRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative flex min-w-[150px] flex-col gap-1.5", className)}>
      <span className="text-[11px] font-semibold tracking-[0.88px] text-[#5b6475]">{fieldLabel}</span>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className={cn(
          "flex h-11 min-h-11 w-full items-center gap-2 rounded-[10px] border border-[#cbd5e1] bg-white px-3.5 text-left text-sm text-[#0f172a] outline-none transition-colors",
          "focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/20",
          open && "border-[var(--accent)]",
          disabled && "cursor-not-allowed opacity-50",
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0 flex-1 truncate">{triggerLabel}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-[#5b6475] transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={menuTitle}
          className="absolute left-0 top-[calc(100%+6px)] z-[120] flex flex-col gap-0.5 rounded-[12px] border border-[#e3e8ef] bg-white p-1.5 shadow-[0px_16px_20px_rgba(15,23,42,0.16)]"
          style={menuWidth ? { width: menuWidth } : { minWidth: "100%", width: "max-content" }}
        >
          <div className="w-full px-2.5 pb-1.5 pt-2">
            <p className="text-[11px] font-semibold leading-[15.95px] tracking-[0.88px] text-[#5b6475]">
              {menuTitle}
            </p>
          </div>

          {options.map((option) => {
            const isSelected = option.value === value
            const showCount = typeof option.count === "number"
            return (
              <div key={option.value} className="flex w-full flex-col">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    isSelected ? "bg-[#eef3ff]" : "bg-transparent hover:bg-[#f8fafc]",
                  )}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <span className="flex w-[18px] shrink-0 items-start justify-center" aria-hidden>
                    {isSelected ? (
                      <img
                        src="/figma/admin/filter-check.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="size-4 max-w-none"
                        draggable={false}
                      />
                    ) : null}
                  </span>

                  {option.dotColor ? (
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: option.dotColor }}
                      aria-hidden
                    />
                  ) : null}

                  <span className="flex min-w-0 flex-1 flex-col items-start">
                    <span
                      className={cn(
                        "text-sm leading-[20.3px]",
                        isSelected ? "font-semibold text-[#1e3a8a]" : "font-normal text-[#0f172a]",
                      )}
                    >
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="text-xs font-normal leading-[17.4px] text-[#5b6475]">
                        {option.description}
                      </span>
                    ) : null}
                  </span>

                  {showCount ? (
                    <span className="shrink-0 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-semibold leading-[17.4px] text-[#475569]">
                      {option.count}
                    </span>
                  ) : null}
                </button>

                {option.dividerAfter ? (
                  <div className="px-1.5 py-1" aria-hidden>
                    <div className="h-px w-full bg-[#eef1f5]" />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export { AdminStudentsFilterDropdown }
