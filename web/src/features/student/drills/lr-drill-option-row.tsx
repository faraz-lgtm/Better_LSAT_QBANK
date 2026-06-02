import { memo, useMemo, type MouseEvent } from "react"
import { Eye } from "lucide-react"

import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import type { PracticeToolMode, RegionKey } from "@/features/student/practice-session/practice-session-types"
import { HtmlContent } from "@/lib/html/html-content"
import { cn } from "@/lib/utils"

const letters = ["A", "B", "C", "D", "E"] as const

type LrDrillOptionRowProps = {
  index: number
  html: string
  findQuery?: string
  regionKey?: RegionKey
  selected: boolean
  hidden: boolean
  disabled?: boolean
  selectedIndex?: number | null
  allowReselect?: boolean
  onSelect: () => void
  onToggleHidden: () => void
  toolMode?: PracticeToolMode
  onContentMouseUp?: (
    regionKey: RegionKey,
    container: HTMLElement | null,
    event?: MouseEvent,
  ) => void
  onContentClick?: (regionKey: RegionKey, container: HTMLElement | null, event: MouseEvent) => void
}

const LrDrillOptionRow = memo(function LrDrillOptionRow({
  index,
  html,
  findQuery,
  regionKey = "mock-choice",
  selected,
  hidden,
  disabled,
  selectedIndex = null,
  allowReselect = false,
  onSelect,
  onToggleHidden,
  toolMode,
  onContentMouseUp,
  onContentClick,
}: LrDrillOptionRowProps) {
  const letter = letters[index] ?? String(index + 1)
  const stableHtml = useMemo(() => html, [html])

  const choiceContent =
    onContentMouseUp != null ? (
      <PracticeAnnotatedContent
        regionKey={regionKey}
        html={stableHtml}
        findQuery={findQuery}
        toolMode={toolMode}
        onMouseUp={onContentMouseUp}
        onClickCapture={onContentClick}
        className={cn("min-w-0 flex-1 pt-0.5", hidden && "line-through")}
      />
    ) : (
      <HtmlContent html={stableHtml} className={cn("min-w-0 flex-1 pt-0.5", hidden && "line-through")} />
    )

  function handleSelect() {
    if (disabled) return
    if (allowReselect || selectedIndex == null || selectedIndex !== index) onSelect()
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleSelect()
        }
      }}
      className={cn(
        "flex items-stretch gap-2 rounded-xl border border-solid text-left text-sm leading-snug transition-colors",
        hidden && "opacity-50",
        disabled ? "cursor-default" : "cursor-pointer",
      )}
      style={{
        borderColor: selected ? "var(--color-student-cta)" : "var(--greyscale-100)",
        borderWidth: selected ? 2 : 1,
        backgroundColor: selected ? "var(--student-expanded-row)" : "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 px-3 py-3">
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
        {choiceContent}
      </div>
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
})

export { LrDrillOptionRow }
