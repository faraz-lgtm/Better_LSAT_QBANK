import { Check, Minus } from "lucide-react"

import { PracticeResultOutcomeIcon } from "@/features/student/practice-session/practice-result-outcome-icon"
import { cn } from "@/lib/utils"

type ActiveDrillOutcomeIconProps = {
  correct: boolean
  unanswered?: boolean
  variant?: "summary" | "inline"
  className?: string
}

function outcomeLabel(correct: boolean, unanswered: boolean): string {
  if (unanswered) return "Unanswered"
  return correct ? "Correct" : "Incorrect"
}

function ActiveDrillOutcomeIcon({
  correct,
  unanswered = false,
  variant = "summary",
  className,
}: ActiveDrillOutcomeIconProps) {
  const label = outcomeLabel(correct, unanswered)

  if (variant === "inline") {
    if (!unanswered && !correct) {
      return (
        <span className={cn("relative size-6 shrink-0", className)} role="img" aria-label={label}>
          <img
            src="/figma/active-drill/outcome-incorrect.svg"
            alt=""
            width={24}
            height={24}
            className="absolute inset-0 size-6"
          />
        </span>
      )
    }

    return (
      <PracticeResultOutcomeIcon
        correct={correct}
        unanswered={unanswered}
        className={cn("size-6", className)}
      />
    )
  }

  const fill = unanswered ? "bg-[#ff6683]" : correct ? "bg-[#00d492]" : "bg-[#df1c41]"

  return (
    <span
      className={cn("flex size-12 shrink-0 items-center justify-center rounded-full px-2.5", fill, className)}
      role="img"
      aria-label={label}
    >
      {unanswered ? (
        <Minus className="size-7 text-white" strokeWidth={2.5} aria-hidden />
      ) : correct ? (
        <Check className="size-7 text-white" strokeWidth={2.5} aria-hidden />
      ) : (
        <img
          src="/figma/active-drill/score-incorrect.svg"
          alt=""
          width={28}
          height={28}
          className="size-7"
        />
      )}
    </span>
  )
}

export { ActiveDrillOutcomeIcon }
