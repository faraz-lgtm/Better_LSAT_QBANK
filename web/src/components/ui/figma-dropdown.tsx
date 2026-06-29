import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

type FigmaDropdownOption = {
  label: string
  value: string
}

type FigmaDropdownVariant = "config" | "pill"

type FigmaDropdownProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  options: FigmaDropdownOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  onOpenChange?: (open: boolean) => void
  /** `config` — gray card fields; `pill` — white toolbar pills (e.g. sort) */
  variant?: FigmaDropdownVariant
}

const MENU_GAP_PX = 8
const MENU_Z_INDEX = 110

/** Apply to the gray config card while its dropdown menu is open. */
const FIGMA_DROPDOWN_CARD_OPEN_CLASS = "relative z-30 overflow-visible"

function updateMenuPosition(trigger: HTMLDivElement) {
  const rect = trigger.getBoundingClientRect()
  return {
    top: rect.bottom + MENU_GAP_PX,
    left: rect.left,
    width: rect.width,
  }
}

/** Figma `19329:25047` — config dropdown trigger + floating menu */
const TRIGGER_CLOSED_CLASS: Record<FigmaDropdownVariant, string> = {
  config: "border-[#dfe1e7] bg-[#f5f9ff] font-normal text-[#062357]",
  pill: "border-[#dfe1e7] bg-white font-medium text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)]",
}

function FigmaDropdown({
  id,
  value,
  onChange,
  options,
  placeholder = "Select option",
  className,
  disabled = false,
  onOpenChange,
  variant = "config",
}: FigmaDropdownProps) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()
  const selected = options.find((option) => option.value === value)
  const displayLabel = selected?.label ?? placeholder

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return
    }

    function syncPosition() {
      const trigger = triggerRef.current
      if (!trigger) return
      setMenuPosition(updateMenuPosition(trigger))
    }

    syncPosition()
    window.addEventListener("resize", syncPosition)
    window.addEventListener("scroll", syncPosition, true)
    return () => {
      window.removeEventListener("resize", syncPosition)
      window.removeEventListener("scroll", syncPosition, true)
    }
  }, [open])

  useEffect(() => {
    if (open) return
    setMenuPosition(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (triggerRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  function handleSelect(nextValue: string) {
    onChange(nextValue)
    setOpen(false)
  }

  const openMenu =
    open && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={id}
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: MENU_Z_INDEX,
            }}
            className="flex flex-col overflow-hidden rounded-[12px] border border-[#dfe1e7] bg-[#f5f9ff] p-2 shadow-[0px_12px_16px_-4px_rgba(13,13,18,0.08),0px_4px_6px_-2px_rgba(13,13,18,0.03)]"
          >
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "box-border flex h-[44px] w-full items-center gap-2 overflow-hidden px-3 py-2 text-left text-[16px] font-normal leading-[1.5] tracking-[0.32px] transition-colors",
                    isSelected
                      ? "rounded-[12px] bg-[#edf3ff] text-[#082c6b]"
                      : "rounded-[8px] bg-[#f5f9ff] text-[#062357] hover:bg-[#edf3ff]/60",
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected ? (
                    <Check className="size-5 shrink-0 text-[#082c6b]" strokeWidth={2} aria-hidden />
                  ) : null}
                </button>
              )
            })}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div ref={triggerRef} className={cn("relative w-full", className)}>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          className={cn(
            "box-border flex h-[52px] w-full items-center gap-2 overflow-hidden rounded-[16px] border border-solid px-3 py-2 text-left text-[16px] font-normal leading-[1.5] tracking-[0.32px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            open
              ? "border-[#0d47a1] bg-[#edf3ff] font-medium text-[#082c6b]"
              : TRIGGER_CLOSED_CLASS[variant],
          )}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
          {open ? (
            <ChevronUp className="size-5 shrink-0 text-[#082c6b]" strokeWidth={2} aria-hidden />
          ) : (
            <ChevronDown className="size-5 shrink-0 text-[#666d80]" strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
      {openMenu}
    </>
  )
}

export {
  FIGMA_DROPDOWN_CARD_OPEN_CLASS,
  FigmaDropdown,
  type FigmaDropdownOption,
  type FigmaDropdownVariant,
}
