import { cn } from "@/lib/utils"

export type BlindReviewAnswerView = "actual" | "blind_review"

type PracticeBlindReviewAnswerToggleProps = {
  value: BlindReviewAnswerView
  onChange: (next: BlindReviewAnswerView) => void
}

function PracticeBlindReviewAnswerToggle({ value, onChange }: PracticeBlindReviewAnswerToggleProps) {
  return (
    <div
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[16px] bg-white p-1"
      role="tablist"
      aria-label="Answer view"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "actual"}
        className={cn(
          "inline-flex h-8 items-center justify-center rounded-[16px] px-4 text-xs font-medium tracking-[0.24px] transition-colors",
          value === "actual"
            ? "bg-[#0d47a1] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
            : "text-[#0d47a1] hover:bg-[#edf3ff]",
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
          "inline-flex h-8 items-center justify-center rounded-[16px] border px-4 text-xs font-semibold tracking-[0.24px] transition-colors",
          value === "blind_review"
            ? "border-[#ff6f00] bg-[#ff6f00] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
            : "border-transparent text-[#ff6f00] hover:bg-[#fff3ea]",
        )}
        onClick={() => onChange("blind_review")}
      >
        Blind Review
      </button>
    </div>
  )
}

export { PracticeBlindReviewAnswerToggle }
