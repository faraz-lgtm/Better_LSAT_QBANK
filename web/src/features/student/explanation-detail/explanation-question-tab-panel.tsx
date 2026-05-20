import { useState } from "react"
import { ChevronRight, Sparkles } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import { HtmlContent } from "@/lib/html/html-content"
import { cn } from "@/lib/utils"

type ExplanationQuestionTabPanelProps = {
  view: Pick<ExplanationQuestionDetailView, "passage" | "questionStem" | "choices" | "correctChoiceId">
}

function ExplanationQuestionTabPanel({ view }: ExplanationQuestionTabPanelProps) {
  const [showCorrect, setShowCorrect] = useState(false)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-2xl border-[color:var(--greyscale-100)] shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-[#eef1f6] pb-4">
          <h3 className="text-base font-bold text-[color:var(--color-student-heading)]">Passage {view.passage.displayNumber}</h3>
          <button
            type="button"
            className="text-sm font-semibold text-[color:var(--color-student-accent)] underline-offset-2 hover:underline"
          >
            Show analysis
          </button>
        </CardHeader>
        <CardContent className="pt-4">
          <HtmlContent
            html={view.passage.body}
            className="max-h-[min(70vh,520px)] overflow-y-auto text-justify text-[15px] leading-relaxed text-[color:var(--text-h)]"
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-[color:var(--greyscale-100)] shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
        <CardHeader className="flex flex-row items-center justify-end gap-3 border-b border-[#eef1f6] pb-4">
          <Sparkles className="size-4 shrink-0 text-[color:var(--color-student-accent)]" aria-hidden />
          <span className="mr-auto text-sm font-medium text-[color:var(--text)]">Question</span>
          <span className="text-sm font-medium text-[color:var(--color-student-heading)]">Show Correct Answer</span>
          <Switch checked={showCorrect} onChange={(e) => setShowCorrect(e.target.checked)} aria-label="Show correct answer" />
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <HtmlContent
            html={view.questionStem}
            className="mb-2 text-base font-semibold leading-snug text-[color:var(--color-student-heading)]"
          />
          <ul className="mt-2 space-y-3">
            {view.choices.map((c) => {
              const isCorrect = c.id === view.correctChoiceId
              const reveal = showCorrect && isCorrect
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border bg-[var(--greyscale-25)] px-4 py-3 text-left text-sm leading-snug text-[color:var(--color-student-heading)] transition-colors hover:bg-slate-100",
                      reveal ? "border-emerald-300 bg-emerald-50/50" : "border-[color:var(--greyscale-100)]",
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--greyscale-100)] text-sm font-bold text-[color:var(--text)]">
                      {c.index}
                    </span>
                    <HtmlContent html={c.text} className="min-w-0 flex-1" />
                    <ChevronRight className="size-4 shrink-0 text-[#94a3b8]" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export { ExplanationQuestionTabPanel }
