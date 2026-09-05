import { useState } from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import type { ExplanationChoice } from "@/features/student/explanation-detail/types"
import { HtmlContent } from "@/lib/html/html-content"
import { stripLeadingChoiceRestatement } from "@/lib/html/strip-leading-choice-restatement"
import { cn } from "@/lib/utils"

const CORRECT_ROW_CLASS = "border-[3px] border-solid border-[var(--explanation-answered)] bg-[var(--explanation-answered-bg)]"
const CORRECT_BADGE_CLASS = "border-[var(--explanation-answered)] bg-[var(--explanation-answered)] text-white"
const HIGHLIGHT_ROW_CLASS = "border-[var(--primary)] bg-[var(--primary-0)]"
const DEFAULT_ROW_CLASS = "border-[var(--greyscale-100)] bg-[var(--greyscale-25)]"
const DEFAULT_BADGE_CLASS = "border-[var(--greyscale-100)] bg-[var(--greyscale-0)]"

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

/** Figma `20299:23177` — explanation question answer choices */
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
        const rowClass = reveal
          ? CORRECT_ROW_CLASS
          : highlighted
            ? HIGHLIGHT_ROW_CLASS
            : DEFAULT_ROW_CLASS
        const badgeClass = reveal ? CORRECT_BADGE_CLASS : DEFAULT_BADGE_CLASS

        const toggleExpanded = () => {
          if (!expandable) return
          setExpandedId((prev) => (prev === c.id ? null : c.id))
        }

        return (
          <li key={c.id}>
            <div
              className={cn(
                "overflow-hidden rounded-[14px] border transition-colors",
                rowClass,
              )}
            >
              {expanded && expandable ? (
                <div className="flex flex-col">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 border-b border-[var(--greyscale-100)] p-4 text-left hover:opacity-90"
                    onClick={toggleExpanded}
                    aria-expanded
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-[10px] border",
                        badgeClass,
                      )}
                    >
                      {reveal ? (
                        <Check className="size-6 text-white" strokeWidth={3} aria-hidden />
                      ) : (
                        <span className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
                          {letter}
                        </span>
                      )}
                    </span>
                    <HtmlContent html={c.text} className="explanation-choice-text min-w-0 flex-1" />
                    <ChevronUp className="size-6 shrink-0 text-[var(--greyscale-300)]" aria-hidden />
                  </button>
                  <div className="rounded-b-[13px] bg-[var(--greyscale-0)] p-4 text-left">
                    <HtmlContent
                      html={stripLeadingChoiceRestatement(c.explanationHtml, c.text)}
                      className="explanation-option-body"
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2.5 p-4 text-left",
                    expandable ? "cursor-pointer hover:opacity-90" : "cursor-default",
                  )}
                  onClick={toggleExpanded}
                  aria-expanded={expandable ? false : undefined}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-[10px] border",
                      badgeClass,
                    )}
                  >
                    {reveal ? (
                      <Check className="size-6 text-white" strokeWidth={3} aria-hidden />
                    ) : (
                      <span className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
                        {letter}
                      </span>
                    )}
                  </span>
                  <HtmlContent html={c.text} className="explanation-choice-text min-w-0 flex-1" />
                  <ChevronDown className="size-6 shrink-0 text-[var(--greyscale-300)]" aria-hidden />
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export { ExplanationChoiceList }
