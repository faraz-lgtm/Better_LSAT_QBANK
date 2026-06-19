import { cn } from "@/lib/utils"

export type BlindReviewAnswerView = "actual" | "blind_review"

type PracticeBlindReviewAnswerToggleProps = {
  value: BlindReviewAnswerView
  onChange: (next: BlindReviewAnswerView) => void
}

function PracticeBlindReviewAnswerToggle({ value, onChange }: PracticeBlindReviewAnswerToggleProps) {
  return (
    <div
      className="inline-flex h-10 shrink-0 items-center rounded-2xl bg-white p-1"
      role="tablist"
      aria-label="Answer view"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "actual"}
        className={cn(
          "inline-flex h-8 items-center justify-center rounded-2xl px-4 text-xs font-semibold tracking-[0.02em] transition-colors",
          value === "actual"
            ? "bg-[#0d47a1] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
            : "text-[#0d47a1] hover:bg-[#f6f8fa]",
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
          "inline-flex h-8 items-center justify-center rounded-2xl border px-4 text-xs font-semibold tracking-[0.02em] transition-colors",
          value === "blind_review"
            ? "border-[#0b4e6e] bg-[#0d47a1] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
            : "border-transparent text-[#0d47a1] hover:bg-[#f6f8fa]",
        )}
        onClick={() => onChange("blind_review")}
      >
        Blind Review
      </button>
    </div>
  )
}

export { PracticeBlindReviewAnswerToggle }
