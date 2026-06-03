import { useState } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ExplanationChoiceList } from "@/features/student/explanation-detail/explanation-choice-list"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import { HtmlContent } from "@/lib/html/html-content"

type ExplanationQuestionTabPanelProps = {
  view: Pick<ExplanationQuestionDetailView, "passage" | "questionStem" | "choices" | "correctChoiceId">
  initialExpandedChoiceId?: string | null
}

function ExplanationQuestionTabPanel({ view, initialExpandedChoiceId }: ExplanationQuestionTabPanelProps) {
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
          <span className="mr-auto text-sm font-medium text-[color:var(--text)]">Question</span>
          <span className="text-sm font-medium text-[color:var(--color-student-heading)]">Show Correct Answer</span>
          <Switch checked={showCorrect} onChange={(e) => setShowCorrect(e.target.checked)} aria-label="Show correct answer" />
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <HtmlContent
            html={view.questionStem}
            className="mb-2 text-base font-semibold leading-snug text-[color:var(--color-student-heading)]"
          />
          <ExplanationChoiceList
            choices={view.choices}
            correctChoiceId={view.correctChoiceId}
            showCorrect={showCorrect}
            initialExpandedChoiceId={initialExpandedChoiceId}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export { ExplanationQuestionTabPanel }
