import { Flag } from "lucide-react"

import { cn } from "@/lib/utils"

type PracticeQuestionFlagButtonProps = {
  flagged: boolean
  onToggle: () => void
  disabled?: boolean
  className?: string
}

function PracticeQuestionFlagButton({ flagged, onToggle, disabled, className }: PracticeQuestionFlagButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition-colors",
        disabled ? "cursor-default opacity-50" : "text-[#666d80] hover:text-[#062357]",
        flagged && "text-[#0d47a1]",
        className,
      )}
      aria-label={flagged ? "Remove flag" : "Flag question for review"}
      aria-pressed={flagged}
      onClick={onToggle}
    >
      <Flag className={cn("size-5", flagged && "fill-current")} strokeWidth={2} />
    </button>
  )
}

export { PracticeQuestionFlagButton }
