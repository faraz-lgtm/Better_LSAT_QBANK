import { cn } from "@/lib/utils"

export type BlindReviewAnswerView = "actual" | "blind_review"

type PracticeBlindReviewAnswerToggleProps = {
  value: BlindReviewAnswerView
  onChange: (next: BlindReviewAnswerView) => void
}

function PracticeBlindReviewAnswerToggle({ value, onChange }: PracticeBlindReviewAnswerToggleProps) {
  return (
    <div
      className="inline-flex rounded-full border border-[#dfe1e7] bg-[#f6f8fa] p-0.5"
      role="tablist"
      aria-label="Answer view"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "actual"}
        className={cn(
          "rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.02em] transition-colors",
          value === "actual"
            ? "bg-[#0d47a1] text-white shadow-sm"
            : "text-[#0d47a1] hover:bg-white/70",
        )}
        onClick={() => onChange("actual")}
      >
        Actual
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "blind_review"}
        className={cn(
          "rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.02em] transition-colors",
          value === "blind_review"
            ? "bg-[#0d47a1] text-white shadow-sm"
            : "text-[#0d47a1] hover:bg-white/70",
        )}
        onClick={() => onChange("blind_review")}
      >
        Blind Review
      </button>
    </div>
  )
}

export { PracticeBlindReviewAnswerToggle }
