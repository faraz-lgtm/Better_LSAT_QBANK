import { Flag } from "lucide-react"

import {
  ACTIVE_DRILL_QUESTION_NAV_BUTTON_ACTIVE_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_BUTTON_ANSWERED_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_BUTTON_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_BUTTON_DEFAULT_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_FLAG_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_FLAG_SLOT_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_ITEM_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { BLIND_REVIEW_QUESTION_NAV_RECOMMENDED_CLASS } from "@/features/student/practice-session/practice-session-blind-review-styles"
import type { PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

/** Figma `18617:35585` — Review footer question outcome */
export type PracticeSessionQuestionNavOutcome = "correct" | "incorrect" | "unanswered"

type PracticeSessionQuestionNavButtonProps = {
  number: number
  active: boolean
  answered: boolean
  flagged?: boolean
  recommendedForBr?: boolean
  /** When set, renders Review-mode outcome chrome (Figma `18617:35585`) */
  outcome?: PracticeSessionQuestionNavOutcome | null
  variant?: PracticeSessionVariant
  onClick: () => void
}

const REVIEW_OUTCOME_ICON_SRC: Record<PracticeSessionQuestionNavOutcome, string> = {
  correct: "/figma/review-nav/outcome-correct.svg",
  incorrect: "/figma/review-nav/outcome-incorrect.svg",
  unanswered: "/figma/review-nav/outcome-unanswered.svg",
}

/** Figma `18617:35585` — 14×14 stroke status glyphs above each pill */
function ReviewOutcomeIcon({ outcome }: { outcome: PracticeSessionQuestionNavOutcome }) {
  const label =
    outcome === "correct" ? "Correct" : outcome === "unanswered" ? "Unanswered" : "Incorrect"

  return (
    <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center" role="img" aria-label={label}>
      <img
        src={REVIEW_OUTCOME_ICON_SRC[outcome]}
        alt=""
        width={14}
        height={14}
        className="size-[14px] shrink-0"
        draggable={false}
      />
    </span>
  )
}

function PracticeSessionQuestionNavButton({
  number,
  active,
  answered,
  flagged = false,
  recommendedForBr = false,
  outcome = null,
  variant = "default",
  onClick,
}: PracticeSessionQuestionNavButtonProps) {
  const isActiveDrill = variant === "active-drill"
  const isBlindReview = variant === "blind-review"

  if (outcome != null) {
    const outcomeChrome =
      outcome === "correct"
        ? "border-[#00bc54] bg-[#00bc54] text-white"
        : outcome === "unanswered"
          ? "border-[#9aa3b5] bg-[#9aa3b5] text-white"
          : "border-[#df1c41] bg-[#df1c41] text-white"

    return (
      <div
        className="flex w-8 shrink-0 flex-col items-center gap-1"
        data-review-nav-outcome={outcome}
      >
        <ReviewOutcomeIcon outcome={outcome} />
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "practice-session-question-nav-btn practice-session-question-nav-btn--review box-border relative inline-flex size-8 shrink-0 items-center justify-center rounded-[12px] border border-solid p-px text-base font-semibold leading-[1.5] tracking-[0.32px]",
            outcomeChrome,
          )}
          aria-current={active ? "true" : undefined}
          aria-label={`Question ${number}, ${
            outcome === "correct" ? "correct" : outcome === "unanswered" ? "unanswered" : "incorrect"
          }`}
        >
          {number}
        </button>
      </div>
    )
  }

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
            recommendedForBr && BLIND_REVIEW_QUESTION_NAV_RECOMMENDED_CLASS,
          )}
          aria-current={active ? "true" : undefined}
          aria-label={
            flagged
              ? `Question ${number}, flagged`
              : recommendedForBr
                ? `Question ${number}, recommended for blind review`
                : `Question ${number}`
          }
        >
          {number}
        </button>
      </div>
    )
  }

  if (isActiveDrill) {
    return (
      <div className={ACTIVE_DRILL_QUESTION_NAV_ITEM_CLASS}>
        <span className={ACTIVE_DRILL_QUESTION_NAV_FLAG_SLOT_CLASS} aria-hidden>
          {flagged ? (
            <Flag className={ACTIVE_DRILL_QUESTION_NAV_FLAG_CLASS} strokeWidth={2} aria-hidden />
          ) : null}
        </span>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            ACTIVE_DRILL_QUESTION_NAV_BUTTON_CLASS,
            active
              ? ACTIVE_DRILL_QUESTION_NAV_BUTTON_ACTIVE_CLASS
              : answered
                ? ACTIVE_DRILL_QUESTION_NAV_BUTTON_ANSWERED_CLASS
                : ACTIVE_DRILL_QUESTION_NAV_BUTTON_DEFAULT_CLASS,
          )}
          aria-current={active ? "true" : undefined}
          aria-label={flagged ? `Question ${number}, flagged` : `Question ${number}`}
        >
          {number}
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
