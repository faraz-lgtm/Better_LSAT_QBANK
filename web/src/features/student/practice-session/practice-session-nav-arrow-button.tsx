import { ArrowLeft, ArrowRight } from "lucide-react"

import {
  ACTIVE_DRILL_NAV_ARROW_GROUP_CLASS,
  ACTIVE_DRILL_NAV_ARROW_ICON_BUTTON_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { cn } from "@/lib/utils"

type PracticeSessionNavArrowButtonProps = {
  direction: "prev" | "next"
  disabled?: boolean
  onClick: () => void
  className?: string
}

function PracticeSessionNavArrowButton({
  direction,
  disabled = false,
  onClick,
  className,
}: PracticeSessionNavArrowButtonProps) {
  const Icon = direction === "prev" ? ArrowLeft : ArrowRight

  return (
    <button
      type="button"
      className={cn(ACTIVE_DRILL_NAV_ARROW_ICON_BUTTON_CLASS, className)}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous question" : "Next question"}
      onClick={onClick}
    >
      <Icon
        className={cn("size-5 shrink-0", disabled ? "text-[#c5cad3]" : "text-[#5e6777]")}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  )
}

export {
  ACTIVE_DRILL_NAV_ARROW_GROUP_CLASS,
  ACTIVE_DRILL_NAV_ARROW_ICON_BUTTON_CLASS,
  PracticeSessionNavArrowButton,
}
