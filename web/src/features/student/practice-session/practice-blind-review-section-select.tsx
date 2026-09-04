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
  /** Figma `20596:145393` — full-width trigger inside the more panel */
  fullWidth?: boolean
}

function PracticeBlindReviewSectionSelect({
  sections,
  activeSectionSessionId,
  onSelect,
  fullWidth = false,
}: PracticeBlindReviewSectionSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const activeSection =
    sections.find((s) => s.sectionSessionId === activeSectionSessionId) ?? sections[0] ?? null
  const activeLabel = activeSection?.label ?? "Section"
  const triggerClass = fullWidth
    ? "inline-flex h-12 w-full items-center justify-between gap-2 rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)] transition-colors hover:bg-[var(--greyscale-25)]"
    : BLIND_REVIEW_SECTION_SELECT_TRIGGER_CLASS

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
      <span className={cn(triggerClass, "cursor-default")}>
        {activeLabel}
      </span>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex shrink-0 flex-col", fullWidth ? "w-full min-w-0" : "min-w-[123px]")}
    >
      <button
        type="button"
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="whitespace-nowrap">{activeLabel}</span>
        {open ? (
          <ChevronUp className="size-5 shrink-0 text-[var(--greyscale-500)]" aria-hidden />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-[var(--greyscale-500)]" aria-hidden />
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
                    "flex h-9 w-full items-center whitespace-nowrap rounded-[16px] px-3 text-left text-base leading-6 tracking-[0.32px] transition-colors",
                    isActive
                      ? "bg-[var(--primary-25)] font-semibold text-[var(--color-student-heading)]"
                      : "font-medium text-[var(--color-student-heading)] hover:bg-[var(--greyscale-25)]",
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
