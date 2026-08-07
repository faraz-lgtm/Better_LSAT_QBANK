import { memo, type MouseEvent } from "react"
import { Eye, EyeOff } from "lucide-react"

import {
  ACTIVE_DRILL_CHOICE_ROW_GRID_CLASS,
  ACTIVE_DRILL_CHOICE_ROW_GRID_WITH_ACTION_CLASS,
  ACTIVE_DRILL_OPTION_EYE_BUTTON_CLASS,
  ACTIVE_DRILL_OPTION_LETTER_SELECTED_CLASS,
  ACTIVE_DRILL_OPTION_LETTER_UNSELECTED_CLASS,
  ACTIVE_DRILL_OPTION_ROW_MASKED_CLASS,
  ACTIVE_DRILL_OPTION_ROW_SELECTED_CLASS,
  ACTIVE_DRILL_OPTION_ROW_UNSELECTED_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { ReviewIdeaIcon } from "@/features/student/practice-session/review-idea-icon"
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
  hidden?: boolean
  masked?: boolean
  maskingMode?: boolean
  disabled?: boolean
  selectedIndex?: number | null
  allowReselect?: boolean
  onSelect: () => void
  onToggleHidden?: () => void
  onToggleMasked?: () => void
  toolMode?: PracticeToolMode
  onContentMouseUp?: (
    regionKey: RegionKey,
    container: HTMLElement | null,
    event?: MouseEvent,
  ) => void
  onContentClick?: (regionKey: RegionKey, container: HTMLElement | null, event: MouseEvent) => void
  variant?: PracticeSessionVariant
  /** When false, hide control is rendered by the side action rail instead */
  showSideAction?: boolean
  /**
   * Figma `18617:35536` — Review mode: idea icon opens choice explanation
   * instead of the eye hide control.
   */
  explanationAction?: boolean
  explanationExpanded?: boolean
  explanationHtml?: string | null
  onToggleExplanation?: () => void
}

const LrDrillOptionRow = memo(function LrDrillOptionRow({
  index,
  html,
  findQuery,
  regionKey = "mock-choice",
  selected,
  hidden = false,
  masked = false,
  maskingMode = false,
  disabled,
  selectedIndex = null,
  allowReselect = false,
  onSelect,
  onToggleHidden,
  onToggleMasked,
  toolMode,
  onContentMouseUp,
  onContentClick,
  variant = "default",
  showSideAction = true,
  explanationAction = false,
  explanationExpanded = false,
  explanationHtml = null,
  onToggleExplanation,
}: LrDrillOptionRowProps) {
  const letter = letters[index] ?? String(index + 1)
  const isActiveDrill = variant === "active-drill"
  const isBlindReview = variant === "blind-review"
  const annotateMode = toolMode != null && toolMode !== "none"
  const hasExplanation = Boolean(explanationHtml?.trim())

  const choiceContent =
    onContentMouseUp != null ? (
      <PracticeAnnotatedContent
        regionKey={regionKey}
        html={html}
        findQuery={findQuery}
        toolMode={toolMode}
        onMouseUp={onContentMouseUp}
        onClickCapture={onContentClick}
        className={cn(
          "min-w-0 flex-1",
          isActiveDrill || isBlindReview
            ? "text-[1em] leading-[1.5] tracking-[0.32px] text-[color:inherit]"
            : "pt-0.5",
          hidden && isBlindReview && "line-through",
          hidden && !isBlindReview && !isActiveDrill && "line-through opacity-60",
        )}
      />
    ) : (
      <HtmlContent
        html={html}
        className={cn("min-w-0 flex-1 pt-0.5", hidden && "line-through opacity-60")}
      />
    )

  function handleSelect() {
    if (disabled || annotateMode) return
    if (maskingMode) {
      onToggleMasked?.()
      return
    }
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) return
    if (allowReselect || selectedIndex == null || selectedIndex !== index) onSelect()
  }

  if (isBlindReview) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-[14px] border transition-colors",
          selected
            ? "border-[#0d47a1] bg-[#f3f7ff] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
            : hidden
              ? "border-[#dfe1e7] bg-[#f6f8fa]"
              : "border-[#dfe1e7] bg-white",
        )}
      >
        <div
          role={annotateMode || explanationAction ? undefined : "button"}
          tabIndex={annotateMode || disabled || explanationAction ? -1 : 0}
          aria-pressed={annotateMode || explanationAction ? undefined : selected}
          aria-disabled={disabled}
          onClick={explanationAction ? undefined : handleSelect}
          onKeyDown={(e) => {
            if (explanationAction || disabled || annotateMode) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleSelect()
            }
          }}
          className={cn(
            "flex items-center justify-between gap-4 p-4 text-left",
            !explanationAction &&
              (disabled ? "cursor-default" : annotateMode ? "cursor-text" : "cursor-pointer"),
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-[14px] text-lg font-bold",
                selected
                  ? "bg-[#f6f8fa] text-[#0d47a1] shadow-[0px_10px_7px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)]"
                  : "bg-[#f3f4f6] text-[#4a5565]",
                hidden && "line-through",
              )}
            >
              {letter}
            </span>
            {choiceContent}
          </div>
          {explanationAction ? (
            <button
              type="button"
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center transition",
                explanationExpanded ? "text-[#0d47a1]" : "text-[#666d80] hover:text-[#062357]",
                !hasExplanation && "opacity-40",
              )}
              aria-label={
                hasExplanation
                  ? explanationExpanded
                    ? `Hide explanation for choice ${letter}`
                    : `Show explanation for choice ${letter}`
                  : `No explanation for choice ${letter}`
              }
              aria-expanded={hasExplanation ? explanationExpanded : undefined}
              disabled={!hasExplanation}
              onClick={(e) => {
                e.stopPropagation()
                onToggleExplanation?.()
              }}
            >
              <ReviewIdeaIcon />
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex size-5 shrink-0 items-center justify-center text-[#666d80] transition hover:text-[#062357]"
              aria-label={hidden ? "Show answer choice" : "Hide answer choice"}
              onClick={(e) => {
                e.stopPropagation()
                onToggleHidden?.()
              }}
            >
              {hidden ? (
                <EyeOff className="size-5" strokeWidth={2} aria-hidden />
              ) : (
                <Eye className="size-5" strokeWidth={2} aria-hidden />
              )}
            </button>
          )}
        </div>
        {explanationAction && explanationExpanded && hasExplanation ? (
          <div className="border-t border-[#dfe1e7] bg-white p-4 text-left">
            <p className="mb-1 text-xs font-medium leading-[1.5] tracking-[0.24px] text-[#666d80]">
              Option explanation
            </p>
            <HtmlContent html={explanationHtml ?? ""} className="explanation-option-body text-[#0d0d12]" />
          </div>
        ) : null}
      </div>
    )
  }

  if (isActiveDrill) {
    return (
      <div
        role={annotateMode ? undefined : "button"}
        tabIndex={annotateMode || disabled ? -1 : 0}
        aria-pressed={annotateMode ? undefined : selected}
        aria-disabled={disabled}
        onClick={handleSelect}
        onKeyDown={(e) => {
          if (disabled || annotateMode) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleSelect()
          }
        }}
        className={cn(
          showSideAction ? ACTIVE_DRILL_CHOICE_ROW_GRID_WITH_ACTION_CLASS : ACTIVE_DRILL_CHOICE_ROW_GRID_CLASS,
          "text-left transition-[background-color,box-shadow,border-color]",
          masked && ACTIVE_DRILL_OPTION_ROW_MASKED_CLASS,
          selected ? ACTIVE_DRILL_OPTION_ROW_SELECTED_CLASS : ACTIVE_DRILL_OPTION_ROW_UNSELECTED_CLASS,
          disabled ? "cursor-default" : annotateMode ? "cursor-text" : maskingMode ? "cursor-pointer" : "cursor-pointer",
        )}
        aria-label={
          masked
            ? `Answer choice ${letter}, masked`
            : maskingMode
              ? `Answer choice ${letter}, click to mask`
              : undefined
        }
      >
        <span
          className={cn(
            "col-start-1 flex size-8 items-center justify-center self-start rounded-[12px]",
            selected ? ACTIVE_DRILL_OPTION_LETTER_SELECTED_CLASS : ACTIVE_DRILL_OPTION_LETTER_UNSELECTED_CLASS,
          )}
        >
          {letter}
        </span>
        <div className="col-start-3 min-w-0 self-start">{choiceContent}</div>
        {showSideAction ? (
          <button
            type="button"
            className={cn(ACTIVE_DRILL_OPTION_EYE_BUTTON_CLASS, "col-start-4 self-start")}
            aria-label={hidden ? "Show answer choice" : "Hide answer choice"}
            onClick={(e) => {
              e.stopPropagation()
              onToggleHidden?.()
            }}
          >
            {hidden ? (
              <Eye className="size-5" strokeWidth={2} aria-hidden />
            ) : (
              <EyeOff className="size-5" strokeWidth={2} aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    )
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
        "flex items-stretch gap-2 rounded-xl border border-solid text-sm leading-snug text-left transition-colors",
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
            onToggleHidden?.()
          }}
        >
          <Eye className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  )
})

export { LrDrillOptionRow }
