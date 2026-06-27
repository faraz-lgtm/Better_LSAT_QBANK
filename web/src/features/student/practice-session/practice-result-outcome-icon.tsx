import { Check, Minus, X } from "lucide-react"

import { cn } from "@/lib/utils"

type PracticeResultOutcomeIconProps = {
  correct: boolean
  unanswered?: boolean
  className?: string
  variant?: "stroke" | "filled" | "grid"
}

function isPracticeAnswerUnanswered(
  answer: { selectedAnswer: string } | undefined | null,
): boolean {
  return answer == null || !answer.selectedAnswer.trim()
}

const OUTCOME_CIRCLE_PATH =
  "M21.8006 9.9995C22.2573 12.2408 21.9318 14.5709 20.8785 16.6013C19.8251 18.6317 18.1075 20.2396 16.0121 21.1568C13.9167 22.0741 11.5702 22.2453 9.36391 21.6419C7.15758 21.0385 5.2248 19.6969 3.88789 17.8409C2.55097 15.9849 1.89073 13.7267 2.01728 11.4429C2.14382 9.15904 3.04949 6.98759 4.58326 5.29067C6.11703 3.59375 8.18619 2.47393 10.4457 2.11795C12.7052 1.76198 15.0184 2.19136 16.9996 3.3345"

function PracticeResultOutcomeIcon({
  correct,
  unanswered = false,
  className,
  variant = "stroke",
}: PracticeResultOutcomeIconProps) {
  if (variant === "grid") {
    return (
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full",
          unanswered ? "bg-[#ff6683]" : correct ? "bg-[#00bc54]" : "bg-[#df1c41]",
          className,
        )}
        aria-hidden
      >
        {unanswered ? (
          <Minus className="size-2.5 text-white" strokeWidth={3} />
        ) : correct ? (
          <Check className="size-2.5 text-white" strokeWidth={3} />
        ) : (
          <X className="size-2.5 text-white" strokeWidth={3} />
        )}
      </span>
    )
  }

  if (variant === "filled") {
    return (
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full",
          unanswered ? "bg-[#ff6683]" : correct ? "bg-[#00bc54]" : "bg-[#df1c41]",
          className,
        )}
        aria-hidden
      >
        {unanswered ? (
          <Minus className="size-3.5 text-white" strokeWidth={2.5} />
        ) : correct ? (
          <Check className="size-3.5 text-white" strokeWidth={2.5} />
        ) : (
          <X className="size-3.5 text-white" strokeWidth={2.5} />
        )}
      </span>
    )
  }

  if (unanswered) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className={cn("size-6 shrink-0", className)}
        aria-hidden
      >
        <g clipPath="url(#practice-result-outcome-unanswered)">
          <path
            d={OUTCOME_CIRCLE_PATH}
            stroke="#FF6683"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M8 12H16" stroke="#FF6683" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <defs>
          <clipPath id="practice-result-outcome-unanswered">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  }

  if (correct) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className={cn("size-6 shrink-0", className)}
        aria-hidden
      >
        <g clipPath="url(#practice-result-outcome-correct)">
          <path
            d={OUTCOME_CIRCLE_PATH}
            stroke="#00D492"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 11L12 14L22 4"
            stroke="#00D492"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="practice-result-outcome-correct">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6 shrink-0", className)}
      aria-hidden
    >
      <g clipPath="url(#practice-result-outcome-incorrect)">
        <path
          d={OUTCOME_CIRCLE_PATH}
          stroke="#DF1C41"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 9L15 15M15 9L9 15"
          stroke="#DF1C41"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="practice-result-outcome-incorrect">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

export { PracticeResultOutcomeIcon, isPracticeAnswerUnanswered }
