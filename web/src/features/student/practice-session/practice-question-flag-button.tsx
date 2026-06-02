import { Flag } from "lucide-react"

import { cn } from "@/lib/utils"

type PracticeQuestionFlagButtonProps = {
  flagged: boolean
  onToggle: () => void
  disabled?: boolean
}

function PracticeQuestionFlagButton({ flagged, onToggle, disabled }: PracticeQuestionFlagButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "shrink-0 transition-colors",
        disabled ? "cursor-default opacity-50" : "text-muted-foreground hover:text-foreground",
        flagged && "text-[var(--color-student-cta)]",
      )}
      aria-label={flagged ? "Remove flag" : "Flag question for review"}
      aria-pressed={flagged}
      onClick={onToggle}
    >
      <Flag className={cn("size-4", flagged && "fill-current")} strokeWidth={2} />
    </button>
  )
}

export { PracticeQuestionFlagButton }
