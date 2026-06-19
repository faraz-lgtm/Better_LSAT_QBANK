import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export type BlindReviewSectionOption = {
  sectionSessionId: string
  label: string
  sectionNumber: number | null
}

const MENU_MIN_WIDTH = 180
const MENU_Z_INDEX = 110

type PracticeBlindReviewSectionSelectProps = {
  sections: BlindReviewSectionOption[]
  activeSectionSessionId: string | null
  onSelect: (sectionSessionId: string) => void
}

function PracticeBlindReviewSectionSelect({
  sections,
  activeSectionSessionId,
  onSelect,
}: PracticeBlindReviewSectionSelectProps) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )
  const containerRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLUListElement | null>(null)

  const activeSection =
    sections.find((s) => s.sectionSessionId === activeSectionSessionId) ?? sections[0] ?? null
  const activeLabel = activeSection?.label ?? "Section"

  useLayoutEffect(() => {
    if (!open || !containerRef.current) {
      setMenuPosition(null)
      return
    }

    function updatePosition() {
      const trigger = containerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const width = Math.max(MENU_MIN_WIDTH, rect.width)
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (containerRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
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

  const triggerClassName =
    "inline-flex h-9 items-center gap-2 rounded-2xl border border-[#dfe1e7] bg-white px-3 text-base font-medium tracking-[0.02em] text-[#062357] transition-colors hover:bg-[#f6f8fa]"

  if (sections.length === 0) {
    return <span className={cn(triggerClassName, "cursor-default")}>{activeLabel}</span>
  }

  const menu =
    open && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: MENU_Z_INDEX,
            }}
            className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
          >
            {sections.map((section) => {
              const isActive = section.sectionSessionId === activeSectionSessionId
              return (
                <li key={section.sectionSessionId} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      "flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-medium tracking-[0.02em] transition-colors",
                      isActive
                        ? "bg-[#edf3ff] font-semibold text-[#0d47a1]"
                        : "text-[#062357] hover:bg-[#f6f8fa]",
                    )}
                    onClick={() => {
                      setOpen(false)
                      if (!isActive) onSelect(section.sectionSessionId)
                    }}
                  >
                    {section.label}
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        className={triggerClassName}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {activeLabel}
        <ChevronDown className={cn("size-5 text-[#666d80] transition-transform", open && "rotate-180")} />
      </button>
      {menu}
    </div>
  )
}

export { PracticeBlindReviewSectionSelect }
