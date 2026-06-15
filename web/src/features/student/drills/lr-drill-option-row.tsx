import { memo, useMemo, type MouseEvent } from "react"
import { Eye } from "lucide-react"

import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import type { PracticeToolMode, RegionKey } from "@/features/student/practice-session/practice-session-types"
import type { PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
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
  variant?: PracticeSessionVariant
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
  variant = "default",
}: LrDrillOptionRowProps) {
  const letter = letters[index] ?? String(index + 1)
  const stableHtml = useMemo(() => html, [html])
  const isActiveDrill = variant === "active-drill"

  const choiceContent =
    onContentMouseUp != null ? (
      <PracticeAnnotatedContent
        regionKey={regionKey}
        html={stableHtml}
        findQuery={findQuery}
        toolMode={toolMode}
        onMouseUp={onContentMouseUp}
        onClickCapture={onContentClick}
        className={cn(
          "min-w-0 flex-1",
          isActiveDrill ? "text-lg leading-normal text-[#0d0d12]" : "pt-0.5",
          hidden && "line-through",
        )}
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
        "flex items-stretch text-left transition-colors",
        isActiveDrill
          ? "gap-4 rounded-2xl py-1 pl-4"
          : "gap-2 rounded-xl border border-solid text-sm leading-snug",
        !isActiveDrill && hidden && "opacity-50",
        disabled ? "cursor-default" : "cursor-pointer",
      )}
      style={
        isActiveDrill
          ? undefined
          : {
              borderColor: selected ? "var(--color-student-cta)" : "var(--greyscale-100)",
              borderWidth: selected ? 2 : 1,
              backgroundColor: selected ? "var(--student-expanded-row)" : "var(--background)",
              color: "var(--foreground)",
            }
      }
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-start",
          isActiveDrill ? "gap-4" : "gap-3 px-3 py-3",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center font-semibold",
            isActiveDrill
              ? "size-8 rounded-xl border-2 border-[#dfe1e7] bg-white text-base text-[#0d0d12]"
              : "mt-0.5 size-8 rounded-full text-xs font-bold",
          )}
          style={
            isActiveDrill
              ? undefined
              : {
                  backgroundColor: "var(--greyscale-25)",
                  color: "var(--color-student-heading)",
                  border: "1px solid var(--greyscale-100)",
                }
          }
        >
          {letter}
        </span>
        {choiceContent}
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center",
          isActiveDrill ? "pr-0" : "border-l pr-2 pl-1",
        )}
        style={isActiveDrill ? undefined : { borderColor: "var(--greyscale-100)" }}
      >
        <button
          type="button"
          className={cn(
            "rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground",
            isActiveDrill ? "size-9 rounded-[10px] p-1.5" : "p-1.5",
          )}
          aria-label={hidden ? "Show answer choice" : "Hide answer choice"}
          onClick={(e) => {
            e.stopPropagation()
            onToggleHidden()
          }}
        >
          <Eye className={isActiveDrill ? "size-6" : "size-4"} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
})

export { LrDrillOptionRow }
