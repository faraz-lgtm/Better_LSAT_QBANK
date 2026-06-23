import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

/** Figma `18617:31654` / `18617:31656` — 52×52 footer nav arrows */
const ACTIVE_DRILL_NAV_ARROW_BUTTON_CLASS =
  "inline-flex size-[52px] shrink-0 items-center justify-center rounded-[16px] border-2 border-[#dfe1e7] bg-[#f6f8fa] p-1 shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-white disabled:opacity-40"

const ACTIVE_DRILL_NAV_ARROW_GROUP_CLASS = "flex h-[52px] shrink-0 items-center gap-4"

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
      className={cn(ACTIVE_DRILL_NAV_ARROW_BUTTON_CLASS, className)}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous question" : "Next question"}
      onClick={onClick}
    >
      <Icon className="size-6 text-[#666d80]" strokeWidth={2} aria-hidden />
    </button>
  )
}

export {
  ACTIVE_DRILL_NAV_ARROW_BUTTON_CLASS,
  ACTIVE_DRILL_NAV_ARROW_GROUP_CLASS,
  PracticeSessionNavArrowButton,
}
