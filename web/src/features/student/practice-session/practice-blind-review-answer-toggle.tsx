import { Check, Minus, X } from "lucide-react"

import { cn } from "@/lib/utils"

export type BlindReviewAnswerView = "clean" | "actual" | "blind_review"

export type BlindReviewAnswerOutcome = "correct" | "incorrect" | "unanswered" | null

type PracticeBlindReviewAnswerToggleProps = {
  value: BlindReviewAnswerView
  onChange: (next: BlindReviewAnswerView) => void
  /** Figma `18617:33941` — Clean / Actual / Blind Review with outcome icons */
  variant?: "blind-review" | "review"
  actualOutcome?: BlindReviewAnswerOutcome
  blindReviewOutcome?: BlindReviewAnswerOutcome
  /** When false, Blind Review tab is visible but not selectable */
  blindReviewEnabled?: boolean
}

function OutcomeIcon({ outcome }: { outcome: BlindReviewAnswerOutcome }) {
  if (outcome == null) return null
  if (outcome === "correct") {
    return (
      <span
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#00bc54]"
        aria-hidden
      >
        <Check className="size-2.5 text-white" strokeWidth={3} />
      </span>
    )
  }
  if (outcome === "unanswered") {
    return (
      <span
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#ff6683]"
        aria-hidden
      >
        <Minus className="size-2.5 text-white" strokeWidth={3} />
      </span>
    )
  }
  return (
    <span
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#df1c41]"
      aria-hidden
    >
      <X className="size-2.5 text-white" strokeWidth={3} />
    </span>
  )
}

function tabClass(active: boolean, reviewChrome: boolean, disabled = false) {
  if (disabled) {
    return "cursor-not-allowed border-[#dfe1e7] bg-[#f6f8fa] text-[#a4acb9] opacity-70"
  }
  if (active) {
    return "border-[#0b4e6e] bg-[#0d47a1] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
  }
  if (reviewChrome) {
    return "border-[#dfe1e7] bg-white text-[#0d47a1] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] hover:bg-[#f6f8fa]"
  }
  return "border-transparent text-[#0d47a1] hover:bg-[#f6f8fa]"
}

function PracticeBlindReviewAnswerToggle({
  value,
  onChange,
  variant = "blind-review",
  actualOutcome = null,
  blindReviewOutcome = null,
  blindReviewEnabled = true,
}: PracticeBlindReviewAnswerToggleProps) {
  const reviewChrome = variant === "review"

  return (
    <div
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[16px] bg-white p-1"
      role="tablist"
      aria-label="Answer view"
    >
      {reviewChrome ? (
        <button
          type="button"
          role="tab"
          aria-selected={value === "clean"}
          className={cn(
            "inline-flex h-8 items-center justify-center rounded-[16px] border px-4 text-xs font-semibold tracking-[0.24px] transition-colors",
            tabClass(value === "clean", true),
          )}
          onClick={() => onChange("clean")}
        >
          Clean
        </button>
      ) : null}

      <button
        type="button"
        role="tab"
        aria-selected={value === "actual"}
        className={cn(
          "inline-flex h-8 items-center justify-center gap-2 rounded-[16px] border px-4 text-xs font-semibold tracking-[0.24px] transition-colors",
          reviewChrome ? "rounded-[12px]" : null,
          tabClass(value === "actual", reviewChrome),
        )}
        onClick={() => onChange("actual")}
      >
        {reviewChrome ? <OutcomeIcon outcome={actualOutcome} /> : null}
        Actual
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={value === "blind_review"}
        aria-disabled={!blindReviewEnabled}
        disabled={!blindReviewEnabled}
        title={blindReviewEnabled ? undefined : "Complete Blind Review to compare answers"}
        className={cn(
          "inline-flex h-8 items-center justify-center gap-2 rounded-[16px] border px-4 text-xs font-semibold tracking-[0.24px] transition-colors",
          reviewChrome ? "rounded-[12px]" : null,
          tabClass(value === "blind_review", reviewChrome, !blindReviewEnabled),
        )}
        onClick={() => {
          if (!blindReviewEnabled) return
          onChange("blind_review")
        }}
      >
        {reviewChrome && blindReviewEnabled ? <OutcomeIcon outcome={blindReviewOutcome} /> : null}
        Blind Review
      </button>
    </div>
  )
}

export { PracticeBlindReviewAnswerToggle }
