import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { ExplanationChoiceList } from "@/features/student/explanation-detail/explanation-choice-list"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import {
  hasPassageAnalysis,
  PassageAnalysisBody,
} from "@/features/student/practice-session/passage-analysis-view"
import { HtmlContent } from "@/lib/html/html-content"
import { cn } from "@/lib/utils"

type ExplanationQuestionTabPanelProps = {
  view: Pick<
    ExplanationQuestionDetailView,
    | "passage"
    | "passageAnalysis"
    | "questionStem"
    | "questionExplanationHtml"
    | "choices"
    | "correctChoiceId"
    | "questionNumber"
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
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]/30",
        checked ? "bg-[var(--primary)]" : "bg-[var(--greyscale-50)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-[var(--greyscale-0)] shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

const paneScrollClass =
  "practice-session-scroll-hidden min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"

function hasExplanationHtml(html: string | null | undefined): boolean {
  return Boolean(html?.trim())
}

function ExplanationQuestionTabPanel({ view, initialExpandedChoiceId }: ExplanationQuestionTabPanelProps) {
  const [showCorrect, setShowCorrect] = useState(false)
  const [stemExpanded, setStemExpanded] = useState(false)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const stemExplanationAvailable = hasExplanationHtml(view.questionExplanationHtml)
  const analysisAvailable = hasPassageAnalysis(view.passageAnalysis)

  return (
    <div className="grid h-full min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-5">
      <article className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl bg-[var(--greyscale-0)] lg:h-full">
        <div className={cn(paneScrollClass, "flex flex-col gap-4 px-4 py-5")}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-8 items-center rounded-full bg-[var(--greyscale-25)] px-4 text-xs font-medium leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">
              PASSAGE {view.passage.displayNumber}
            </span>
            {analysisAvailable ? (
              <button
                type="button"
                className="text-sm font-medium leading-5 text-[var(--primary)] hover:underline"
                aria-expanded={analysisOpen}
                onClick={() => setAnalysisOpen((prev) => !prev)}
              >
                {analysisOpen ? "Hide analysis" : "Show analysis"}
              </button>
            ) : (
              <span className="text-sm font-medium leading-5 text-[var(--greyscale-300)]">Show analysis</span>
            )}
          </div>

          {analysisOpen && analysisAvailable && view.passageAnalysis ? (
            <PassageAnalysisBody analysis={view.passageAnalysis} passageBody={view.passage.body} />
          ) : (
            <HtmlContent html={view.passage.body} className="explanation-passage-body" />
          )}
        </div>
      </article>

      <article className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl bg-[var(--greyscale-0)] lg:h-full">
        <div className={cn(paneScrollClass, "flex flex-col gap-4 px-4 py-5")}>
          <div className="flex flex-col gap-3">
            <div className="flex h-8 items-center justify-between gap-3">
              <span className="inline-flex h-8 items-center rounded-xl bg-[var(--primary-0)] px-3 text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">
                Question {view.questionNumber}
              </span>
              <div className="flex items-center gap-4 px-2">
                <span className="text-xs font-normal leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">
                  Show Correct Answer
                </span>
                <RepWorkAnswerToggle
                  checked={showCorrect}
                  onCheckedChange={setShowCorrect}
                  label="Show correct answer"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2.5 text-left",
                  stemExplanationAvailable ? "cursor-pointer hover:opacity-90" : "cursor-default",
                )}
                onClick={() => {
                  if (!stemExplanationAvailable) return
                  setStemExpanded((prev) => !prev)
                }}
                aria-expanded={stemExplanationAvailable ? stemExpanded : undefined}
              >
                <HtmlContent html={view.questionStem} className="explanation-question-stem min-w-0 flex-1" />
                {stemExplanationAvailable ? (
                  stemExpanded ? (
                    <ChevronUp className="size-6 shrink-0 text-[var(--greyscale-300)]" aria-hidden />
                  ) : (
                    <ChevronDown className="size-6 shrink-0 text-[var(--greyscale-300)]" aria-hidden />
                  )
                ) : (
                  <ChevronDown className="size-6 shrink-0 text-[var(--greyscale-300)]" aria-hidden />
                )}
              </button>
              {stemExpanded && stemExplanationAvailable ? (
                <div className="text-left">
                  <HtmlContent
                    html={view.questionExplanationHtml ?? ""}
                    className="explanation-review-body"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <ExplanationChoiceList
            choices={view.choices}
            correctChoiceId={view.correctChoiceId}
            showCorrect={showCorrect}
            initialExpandedChoiceId={initialExpandedChoiceId}
          />
        </div>
      </article>
    </div>
  )
}

export { ExplanationQuestionTabPanel }
