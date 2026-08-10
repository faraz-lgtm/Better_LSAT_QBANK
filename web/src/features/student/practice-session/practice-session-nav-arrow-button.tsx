import { ArrowLeft, ArrowRight } from "lucide-react"

import {
  ACTIVE_DRILL_NAV_ARROW_BUTTON_CLASS,
  ACTIVE_DRILL_NAV_ARROW_ICON_BUTTON_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { cn } from "@/lib/utils"

/** Figma `18617:35725` / `18617:35727` — narrow arrow glyphs */
const FIGMA_NARROW_ARROW_SRC = {
  prev: "/figma/review-nav/arrow-narrow-left.svg",
  next: "/figma/review-nav/arrow-narrow-right.svg",
} as const

type PracticeSessionNavArrowButtonProps = {
  direction: "prev" | "next"
  disabled?: boolean
  onClick: () => void
  className?: string
  iconOnly?: boolean
  /** Use Figma `18617:35585` narrow arrow assets (18×14) */
  figmaNarrowArrow?: boolean
}

function PracticeSessionNavArrowButton({
  direction,
  disabled = false,
  onClick,
  className,
  iconOnly = false,
  figmaNarrowArrow = false,
}: PracticeSessionNavArrowButtonProps) {
  const Icon = direction === "prev" ? ArrowLeft : ArrowRight
  const iconClassName = cn("size-4 shrink-0", disabled ? "text-[#a4acb9]" : "text-current")

  if (iconOnly) {
    return (
      <button
        type="button"
        className={cn(ACTIVE_DRILL_NAV_ARROW_ICON_BUTTON_CLASS, className)}
        disabled={disabled}
        aria-label={direction === "prev" ? "Previous question" : "Next question"}
        onClick={onClick}
      >
        {figmaNarrowArrow ? (
          <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden">
            <img
              src={FIGMA_NARROW_ARROW_SRC[direction]}
              alt=""
              width={18}
              height={14}
              className={cn("h-[14px] w-[18px] shrink-0", disabled && "opacity-40")}
              draggable={false}
            />
          </span>
        ) : (
          <Icon
            className={cn("size-5 shrink-0", disabled ? "text-[#c5cad3]" : "text-[#5e6777]")}
            strokeWidth={2}
            aria-hidden
          />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      className={cn(ACTIVE_DRILL_NAV_ARROW_BUTTON_CLASS, className)}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous question" : "Next question"}
      onClick={onClick}
    >
      {direction === "prev" ? (
        <>
          <Icon className={iconClassName} strokeWidth={2} aria-hidden />
          <span>Prev</span>
        </>
      ) : (
        <>
          <span>Next</span>
          <Icon className={iconClassName} strokeWidth={2} aria-hidden />
        </>
      )}
    </button>
  )
}

export { PracticeSessionNavArrowButton }
