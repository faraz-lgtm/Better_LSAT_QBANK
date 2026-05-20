import { Eye } from "lucide-react"

import { HtmlContent } from "@/lib/html/html-content"
import { cn } from "@/lib/utils"

const letters = ["A", "B", "C", "D", "E"] as const

type LrDrillOptionRowProps = {
  index: number
  html: string
  selected: boolean
  hidden: boolean
  onSelect: () => void
  onToggleHidden: () => void
}

function LrDrillOptionRow({ index, html, selected, hidden, onSelect, onToggleHidden }: LrDrillOptionRowProps) {
  const letter = letters[index] ?? String(index + 1)
  return (
    <div
      className={cn("flex items-stretch gap-2 rounded-xl border border-solid transition-colors", hidden && "opacity-50")}
      style={{
        borderColor: selected ? "var(--color-student-cta)" : "var(--greyscale-100)",
        borderWidth: selected ? 2 : 1,
        backgroundColor: selected ? "var(--student-expanded-row)" : "var(--background)",
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-start gap-3 px-3 py-3 text-left text-sm leading-snug"
        style={{ color: "var(--foreground)" }}
      >
        <span
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{
            backgroundColor: "var(--greyscale-25)",
            color: "var(--color-student-heading)",
            border: "1px solid var(--greyscale-100)",
          }}
        >
          {letter}
        </span>
        <HtmlContent html={html} className={cn("min-w-0 flex-1 pt-0.5", hidden && "line-through")} />
      </button>
      <div className="flex shrink-0 items-center border-l pr-2 pl-1" style={{ borderColor: "var(--greyscale-100)" }}>
        <button
          type="button"
          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={hidden ? "Show answer choice" : "Hide answer choice"}
          onClick={(e) => {
            e.stopPropagation()
            onToggleHidden()
          }}
        >
          <Eye className="size-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export { LrDrillOptionRow }
