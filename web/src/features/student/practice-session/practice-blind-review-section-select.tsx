import { useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import {
  BLIND_REVIEW_SECTION_SELECT_MENU_CLASS,
  BLIND_REVIEW_SECTION_SELECT_TRIGGER_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
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
      <span className={cn(BLIND_REVIEW_SECTION_SELECT_TRIGGER_CLASS, "cursor-default")}>
        {activeLabel}
      </span>
    )
  }

  return (
    <div ref={containerRef} className="relative inline-flex min-w-[123px] shrink-0 flex-col">
      <button
        type="button"
        className={BLIND_REVIEW_SECTION_SELECT_TRIGGER_CLASS}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="whitespace-nowrap">{activeLabel}</span>
        {open ? (
          <ChevronUp className="size-5 shrink-0 text-[#666d80]" aria-hidden />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-[#666d80]" aria-hidden />
        )}
      </button>

      {open ? (
        <ul role="listbox" className={BLIND_REVIEW_SECTION_SELECT_MENU_CLASS}>
          {sections.map((section) => {
            const isActive = section.sectionSessionId === activeSectionSessionId
            return (
              <li key={section.sectionSessionId} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    "flex h-9 w-full items-center whitespace-nowrap rounded-xl px-3 text-left text-base leading-6 tracking-[0.32px] transition-colors",
                    isActive
                      ? "bg-[#edf3ff] font-semibold text-[#062357]"
                      : "font-medium text-[#062357] hover:bg-[#f6f8fa]",
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
