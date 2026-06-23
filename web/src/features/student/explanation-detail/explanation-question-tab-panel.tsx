import { useState } from "react"

import { ExplanationChoiceList } from "@/features/student/explanation-detail/explanation-choice-list"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import { HtmlContent } from "@/lib/html/html-content"
import { cn } from "@/lib/utils"

type ExplanationQuestionTabPanelProps = {
  view: Pick<
    ExplanationQuestionDetailView,
    "passage" | "questionStem" | "choices" | "correctChoiceId" | "questionNumber"
  >
  initialExpandedChoiceId?: string | null
}

function RepWorkAnswerToggle({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d47a1]/30",
        checked ? "bg-[#0d47a1]" : "bg-[color:var(--greyscale-100)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

const paneScrollClass =
  "student-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden max-h-[min(52vh,480px)] lg:max-h-none"

function ExplanationQuestionTabPanel({ view, initialExpandedChoiceId }: ExplanationQuestionTabPanelProps) {
  const [showCorrect, setShowCorrect] = useState(false)

  return (
    <div className="grid h-full min-h-0 gap-6 lg:grid-cols-2">
      <article className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[20px] bg-white lg:h-full">
        <div className="flex shrink-0 items-center gap-3 px-6 pt-6">
          <span className="inline-flex h-8 items-center rounded-full bg-[var(--greyscale-25)] px-4 text-xs font-medium tracking-[0.02em] text-[#666d80]">
            PASSAGE {view.passage.displayNumber}
          </span>
          <button type="button" className="text-sm font-medium text-[#0d47a1] transition-opacity hover:opacity-80">
            Show analysis
          </button>
        </div>
        <div className={cn(paneScrollClass, "px-6 pb-6 pt-4")}>
          <HtmlContent
            html={view.passage.body}
            className="explanation-detail-body text-sm leading-[1.8] text-[#0d0d12]"
          />
        </div>
      </article>

      <article className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[20px] border border-[color:var(--greyscale-100)] bg-white lg:h-full">
        <div className="flex shrink-0 items-center justify-between gap-3 px-6 pt-6">
          <span className="inline-flex h-8 items-center rounded-xl bg-[var(--primary-0)] px-3 text-sm font-medium tracking-[0.02em] text-[#062357]">
            Question {view.questionNumber}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs font-normal tracking-[0.02em] text-[#666d80]">Show Correct Answer</span>
            <RepWorkAnswerToggle
              checked={showCorrect}
              onCheckedChange={setShowCorrect}
              label="Show correct answer"
            />
          </div>
        </div>
        <div className={cn(paneScrollClass, "px-6 pb-6 pt-4")}>
          <div className="flex flex-col gap-4">
            <HtmlContent
              html={view.questionStem}
              className="explanation-detail-body text-base font-medium leading-normal tracking-[0.02em] text-[#062357]"
            />
            <ExplanationChoiceList
              choices={view.choices}
              correctChoiceId={view.correctChoiceId}
              showCorrect={showCorrect}
              initialExpandedChoiceId={initialExpandedChoiceId}
            />
          </div>
        </div>
      </article>
    </div>
  )
}

export { ExplanationQuestionTabPanel }
