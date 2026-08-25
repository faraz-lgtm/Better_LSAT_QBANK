import { ACTIVE_DRILL_RESET_RESPONSE_BUTTON_CLASS } from "@/features/student/practice-session/practice-session-active-drill-styles"
import { cn } from "@/lib/utils"

type PracticeSessionResetResponseButtonProps = {
  onClick: () => void
  className?: string
}

function PracticeSessionResetResponseButton({
  onClick,
  className,
}: PracticeSessionResetResponseButtonProps) {
  return (
    <div className={cn("flex w-full justify-end", className)}>
      <button
        type="button"
        className={ACTIVE_DRILL_RESET_RESPONSE_BUTTON_CLASS}
        onClick={onClick}
      >
        Reset Response
      </button>
    </div>
  )
}

export { PracticeSessionResetResponseButton }
