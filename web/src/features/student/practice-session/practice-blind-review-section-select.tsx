import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export type BlindReviewSectionOption = {
  sectionSessionId: string
  label: string
  sectionNumber: number | null
}

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
  const containerRef = useRef<HTMLDivElement | null>(null)

  const activeSection =
    sections.find((s) => s.sectionSessionId === activeSectionSessionId) ?? sections[0] ?? null
  const activeLabel = activeSection?.label ?? "Section"

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

  if (sections.length === 0) {
    return (
      <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-3 text-sm font-semibold text-[#062357]">
        {activeLabel}
      </span>
    )
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        className="inline-flex h-9 items-center gap-1 rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-3 text-sm font-semibold text-[#062357] transition-colors hover:bg-white"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {activeLabel}
        <ChevronDown className={cn("size-3.5 text-[#666d80] transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[180px] overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
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
        </ul>
      ) : null}
    </div>
  )
}

export { PracticeBlindReviewSectionSelect }
