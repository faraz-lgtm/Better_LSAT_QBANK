import { Flag } from "lucide-react"

import type { PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type PracticeSessionQuestionNavButtonProps = {
  number: number
  active: boolean
  answered: boolean
  flagged?: boolean
  variant?: PracticeSessionVariant
  onClick: () => void
}

function PracticeSessionQuestionNavButton({
  number,
  active,
  answered,
  flagged = false,
  variant = "default",
  onClick,
}: PracticeSessionQuestionNavButtonProps) {
  const isActiveDrill = variant === "active-drill"
  const isBlindReview = variant === "blind-review"

  if (isBlindReview) {
    const filled = active || answered

    return (
      <div className="flex w-8 shrink-0 flex-col items-center gap-[6px]">
        {active ? (
          <span className="h-[10px] w-1 shrink-0 rounded-sm bg-[#062357]" aria-hidden />
        ) : (
          <span className="h-[10px] w-1 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "practice-session-question-nav-btn box-border relative shrink-0 text-base font-semibold tracking-[0.32px] transition-colors",
            filled
              ? "border-2 border-[#0b4e6e] bg-[#0d47a1] text-white"
              : "border-2 border-[#dfe1e7] bg-white text-[#062357]",
          )}
          aria-current={active ? "true" : undefined}
          aria-label={flagged ? `Question ${number}, flagged` : `Question ${number}`}
        >
          {number}
        </button>
      </div>
    )
  }

  if (isActiveDrill) {
    const filled = active || answered

    return (
      <div className="flex w-8 shrink-0 flex-col items-center gap-1.5">
        {active ? (
          <span className="h-2 w-1 shrink-0 rounded-sm bg-[#062357]" aria-hidden />
        ) : (
          <span className="h-2 w-1 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "practice-session-question-nav-btn relative shrink-0 text-sm font-semibold tracking-[0.28px] transition-colors",
            filled
              ? "border border-[#0d47a1] bg-[#0d47a1] text-white"
              : "border border-[#dfe1e7] bg-white text-[#062357]",
          )}
          aria-current={active ? "true" : undefined}
          aria-label={flagged ? `Question ${number}, flagged` : `Question ${number}`}
        >
          {number}
          {flagged ? (
            <Flag
              className={cn(
                "absolute -right-0.5 -top-0.5 size-2.5",
                filled ? "fill-white text-white" : "fill-[#0d47a1] text-[#0d47a1]",
              )}
              strokeWidth={2}
              aria-hidden
            />
          ) : null}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="practice-session-question-nav-btn relative shrink-0 text-xs font-bold transition-colors"
      style={{
        backgroundColor: active || answered ? "var(--color-student-cta)" : "#fff",
        color: active || answered ? "#fff" : "var(--color-student-heading)",
        border: `1px solid ${active || answered ? "var(--color-student-cta)" : "var(--greyscale-100)"}`,
      }}
      aria-current={active ? "true" : undefined}
      aria-label={flagged ? `Question ${number}, flagged` : `Question ${number}`}
    >
      {active ? (
        <span
          className="absolute -top-2.5 left-1/2 h-2.5 w-[3px] -translate-x-1/2 rounded-full"
          style={{ backgroundColor: "var(--color-student-cta)" }}
          aria-hidden
        />
      ) : null}
      {number}
      {flagged ? (
        <Flag
          className="absolute -right-0.5 -top-0.5 size-2.5 fill-[var(--color-student-cta)] text-[var(--color-student-cta)]"
          strokeWidth={2}
          aria-hidden
        />
      ) : null}
    </button>
  )
}

export { PracticeSessionQuestionNavButton }
