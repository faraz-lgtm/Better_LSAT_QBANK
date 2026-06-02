import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import type { ExplanationChoice } from "@/features/student/explanation-detail/types"
import { HtmlContent } from "@/lib/html/html-content"
import { cn } from "@/lib/utils"

type ExplanationChoiceListProps = {
  choices: ExplanationChoice[]
  correctChoiceId: string
  showCorrect: boolean
  highlightChoiceId?: string | null
  initialExpandedChoiceId?: string | null
}

function hasExplanation(html: string | null | undefined): boolean {
  return Boolean(html?.trim())
}

function ExplanationChoiceList({
  choices,
  correctChoiceId,
  showCorrect,
  highlightChoiceId,
  initialExpandedChoiceId,
}: ExplanationChoiceListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedChoiceId ?? null)

  return (
    <ul className="mt-2 space-y-3">
      {choices.map((c) => {
        const isCorrect = c.id === correctChoiceId
        const reveal = showCorrect && isCorrect
        const highlighted = highlightChoiceId != null && c.id === highlightChoiceId
        const expandable = hasExplanation(c.explanationHtml)
        const expanded = expandedId === c.id

        return (
          <li key={c.id}>
            <div
              className={cn(
                "overflow-hidden rounded-xl border bg-[var(--greyscale-25)] text-left text-sm leading-snug text-[color:var(--color-student-heading)] transition-colors",
                reveal ? "border-emerald-300 bg-emerald-50/50" : "border-[color:var(--greyscale-100)]",
                highlighted && !reveal && "border-[#0d47a1] bg-[#edf3ff]/60",
              )}
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left",
                  expandable ? "cursor-pointer hover:bg-slate-100/80" : "cursor-default",
                )}
                onClick={() => {
                  if (!expandable) return
                  setExpandedId((prev) => (prev === c.id ? null : c.id))
                }}
                aria-expanded={expandable ? expanded : undefined}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--greyscale-100)] text-sm font-bold text-[color:var(--text)]">
                  {c.index}
                </span>
                <HtmlContent html={c.text} className="min-w-0 flex-1" />
                {expandable ? (
                  expanded ? (
                    <ChevronDown className="size-4 shrink-0 text-[#94a3b8]" aria-hidden />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-[#94a3b8]" aria-hidden />
                  )
                ) : null}
              </button>
              {expandable && expanded ? (
                <div className="border-t border-[color:var(--greyscale-100)] bg-white/80 px-4 py-3 text-left">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#666d80]">
                    Option explanation
                  </p>
                  <HtmlContent
                    html={c.explanationHtml ?? ""}
                    className="text-sm leading-relaxed text-[color:var(--color-student-heading)]"
                  />
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export { ExplanationChoiceList }
