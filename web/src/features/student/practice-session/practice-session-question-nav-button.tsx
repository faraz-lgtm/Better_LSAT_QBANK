import { Flag } from "lucide-react"

type PracticeSessionQuestionNavButtonProps = {
  number: number
  active: boolean
  answered: boolean
  flagged?: boolean
  onClick: () => void
}

function PracticeSessionQuestionNavButton({
  number,
  active,
  answered,
  flagged = false,
  onClick,
}: PracticeSessionQuestionNavButtonProps) {
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
