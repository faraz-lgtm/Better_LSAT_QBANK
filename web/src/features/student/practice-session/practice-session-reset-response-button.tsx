import { ACTIVE_DRILL_RESET_RESPONSE_BUTTON_CLASS } from "@/features/student/practice-session/practice-session-active-drill-styles"
import {
  OFFICIAL_RESET_RESPONSE_BUTTON_CLASS,
  OFFICIAL_RESET_RESPONSE_WRAP_CLASS,
} from "@/features/student/practice-session/practice-session-official-styles"
import { isOfficialLayout, type PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type PracticeSessionResetResponseButtonProps = {
  onClick: () => void
  className?: string
  variant?: PracticeSessionVariant
}

function PracticeSessionResetResponseButton({
  onClick,
  className,
  variant = "default",
}: PracticeSessionResetResponseButtonProps) {
  return (
    <div
      className={cn(
        isOfficialLayout(variant) ? OFFICIAL_RESET_RESPONSE_WRAP_CLASS : "flex w-full justify-end",
        className,
      )}
    >
      <button
        type="button"
        className={
          isOfficialLayout(variant) ? OFFICIAL_RESET_RESPONSE_BUTTON_CLASS : ACTIVE_DRILL_RESET_RESPONSE_BUTTON_CLASS
        }
        onClick={onClick}
      >
        Reset Response
      </button>
    </div>
  )
}

export { PracticeSessionResetResponseButton }
