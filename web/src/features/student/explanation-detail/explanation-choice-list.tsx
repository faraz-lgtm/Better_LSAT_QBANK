import { useState } from "react"
import { Check, ChevronRight } from "lucide-react"

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

function choiceLetter(c: ExplanationChoice): string {
  const fromId = c.id.trim().toUpperCase().slice(0, 1)
  if (/^[A-E]$/.test(fromId)) return fromId
  if (c.index >= 1 && c.index <= 5) return String.fromCharCode(64 + c.index)
  return fromId || "A"
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
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {choices.map((c) => {
        const letter = choiceLetter(c)
        const isCorrect = c.id === correctChoiceId
        const reveal = showCorrect && isCorrect
        const highlighted = highlightChoiceId != null && c.id === highlightChoiceId
        const expandable = hasExplanation(c.explanationHtml)
        const expanded = expandedId === c.id

        return (
          <li key={c.id}>
            <div
              className={cn(
                "overflow-hidden rounded-[14px] border transition-colors",
                reveal || highlighted
                  ? "border-[#0d47a1] bg-[var(--primary-0)]"
                  : "border-[color:var(--greyscale-100)] bg-[var(--greyscale-25)]",
              )}
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-2.5 p-4 text-left",
                  expandable ? "cursor-pointer hover:opacity-90" : "cursor-default",
                )}
                onClick={() => {
                  if (!expandable) return
                  setExpandedId((prev) => (prev === c.id ? null : c.id))
                }}
                aria-expanded={expandable ? expanded : undefined}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-[10px] border",
                    reveal
                      ? "border-[#0d47a1] bg-[var(--secondary-100)]"
                      : "border-[color:var(--greyscale-100)] bg-white",
                  )}
                >
                  {reveal ? (
                    <Check className="size-6 text-[#0d47a1]" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <span className="text-sm font-medium tracking-[0.02em] text-[#666d80]">{letter}</span>
                  )}
                </span>
                <HtmlContent
                  html={c.text}
                  className="explanation-detail-body min-w-0 flex-1 text-sm font-medium leading-normal tracking-[0.02em] text-[#272835]"
                />
                <ChevronRight className="size-6 shrink-0 text-[#818898]" aria-hidden />
              </button>
              {expandable && expanded ? (
                <div className="border-t border-[color:var(--greyscale-100)] bg-white px-4 py-3 text-left">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#666d80]">
                    Option explanation
                  </p>
                  <HtmlContent
                    html={c.explanationHtml ?? ""}
                    className="explanation-detail-body text-[#062357]"
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
