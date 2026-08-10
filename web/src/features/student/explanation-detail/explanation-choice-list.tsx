import { useState } from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

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

/** Figma `18624:81193` — explanation question answer choices */
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
        const accented = reveal || highlighted

        return (
          <li key={c.id}>
            <div
              className={cn(
                "overflow-hidden rounded-[14px] border transition-colors",
                accented
                  ? "border-[#0d47a1] bg-[#f3f7ff]"
                  : "border-[#dfe1e7] bg-[#f6f8fa]",
              )}
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 p-4 text-left",
                  expandable ? "cursor-pointer hover:opacity-90" : "cursor-default",
                  expanded && "border-b border-[#dfe1e7]",
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
                      ? "border-[#0d47a1] bg-[#f2f7ff]"
                      : "border-[#dfe1e7] bg-white",
                  )}
                >
                  {reveal ? (
                    <Check className="size-5 text-[#0d47a1]" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <span className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#666d80]">
                      {letter}
                    </span>
                  )}
                </span>
                <HtmlContent html={c.text} className="explanation-choice-text min-w-0 flex-1" />
                {expanded ? (
                  <ChevronUp className="size-6 shrink-0 text-[#818898]" aria-hidden />
                ) : (
                  <ChevronDown className="size-6 shrink-0 text-[#818898]" aria-hidden />
                )}
              </button>
              {expandable && expanded ? (
                <div className="bg-white p-4 text-left">
                  <HtmlContent html={c.explanationHtml ?? ""} className="explanation-option-body" />
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
