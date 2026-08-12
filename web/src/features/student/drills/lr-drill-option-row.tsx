import { memo, useRef, type KeyboardEvent, type PointerEvent } from "react"
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
import type { BlindReviewAnswerView } from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import {
  BLIND_REVIEW_OPTION_LETTER_SELECTED_ACTUAL_CLASS,
  BLIND_REVIEW_OPTION_LETTER_SELECTED_BR_CLASS,
  BLIND_REVIEW_OPTION_ROW_SELECTED_ACTUAL_CLASS,
  BLIND_REVIEW_OPTION_ROW_SELECTED_BR_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { ReviewIdeaIcon } from "@/features/student/practice-session/review-idea-icon"
import type { RegionKey } from "@/features/student/practice-session/practice-session-types"
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
  variant?: PracticeSessionVariant
  /** Actual vs Blind Review — changes selected option colors in BR layout */
  answerView?: BlindReviewAnswerView
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

function selectionFullyInside(node: Node): boolean {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return false
  const range = selection.getRangeAt(0)
  return node.contains(range.startContainer) && node.contains(range.endContainer)
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
  variant = "default",
  answerView = "blind_review",
  showSideAction = true,
  explanationAction = false,
  explanationExpanded = false,
  explanationHtml = null,
  onToggleExplanation,
}: LrDrillOptionRowProps) {
  const letter = letters[index] ?? String(index + 1)
  const isActiveDrill = variant === "active-drill"
  const isBlindReview = variant === "blind-review"
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const hasExplanation = Boolean(explanationHtml?.trim())
  const isActualAnswerView = answerView === "actual"
  const brSelectedRowClass = isActualAnswerView
    ? BLIND_REVIEW_OPTION_ROW_SELECTED_ACTUAL_CLASS
    : BLIND_REVIEW_OPTION_ROW_SELECTED_BR_CLASS
  const brSelectedLetterClass = isActualAnswerView
    ? BLIND_REVIEW_OPTION_LETTER_SELECTED_ACTUAL_CLASS
    : BLIND_REVIEW_OPTION_LETTER_SELECTED_BR_CLASS

  // Display-only: annotation tools apply to the passage pane, not answer choices.
  const choiceContent = (
    <PracticeAnnotatedContent
      regionKey={regionKey}
      html={html}
      findQuery={findQuery}
      toolMode="none"
      className={cn(
        "min-w-0 flex-1",
        isActiveDrill || isBlindReview
          ? "text-[1em] leading-[1.5] tracking-[0.32px] text-[color:inherit]"
          : "pt-0.5",
        hidden && isBlindReview && "line-through opacity-50",
        hidden && !isBlindReview && !isActiveDrill && "line-through opacity-50 blur-[2px]",
        masked && "select-none",
      )}
    />
  )

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    // Passage selections must not block answer clicks.
    if (!selectionFullyInside(e.currentTarget)) {
      window.getSelection()?.removeAllRanges()
    }
  }

  function handleSelect() {
    if (disabled) return
    if (maskingMode) {
      onToggleMasked?.()
      return
    }

    pointerStartRef.current = null
    window.getSelection()?.removeAllRanges()

    if (allowReselect || selectedIndex == null || selectedIndex !== index) onSelect()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleSelect()
    }
  }

  if (isBlindReview) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-[14px] border transition-colors",
          selected
            ? brSelectedRowClass
            : hidden
              ? "border-[#dfe1e7] bg-[#f6f8fa]"
              : "border-[#dfe1e7] bg-white",
        )}
      >
        <div
          role={explanationAction ? undefined : "button"}
          tabIndex={disabled || explanationAction ? -1 : 0}
          aria-pressed={explanationAction ? undefined : selected}
          aria-disabled={disabled}
          onPointerDown={explanationAction ? undefined : handlePointerDown}
          onClick={explanationAction ? undefined : handleSelect}
          onKeyDown={explanationAction ? undefined : handleKeyDown}
          className={cn(
            "flex items-center justify-between gap-4 p-4 text-left",
            !explanationAction && (disabled ? "cursor-default" : "cursor-pointer"),
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-[14px] text-lg font-bold",
                selected ? brSelectedLetterClass : "bg-[#f3f4f6] text-[#4a5565]",
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
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={selected}
        aria-disabled={disabled}
        onPointerDown={handlePointerDown}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        className={cn(
          showSideAction ? ACTIVE_DRILL_CHOICE_ROW_GRID_WITH_ACTION_CLASS : ACTIVE_DRILL_CHOICE_ROW_GRID_CLASS,
          "text-left transition-[background-color,box-shadow,border-color]",
          masked && ACTIVE_DRILL_OPTION_ROW_MASKED_CLASS,
          selected ? ACTIVE_DRILL_OPTION_ROW_SELECTED_CLASS : ACTIVE_DRILL_OPTION_ROW_UNSELECTED_CLASS,
          disabled ? "cursor-default" : "cursor-pointer",
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
      onPointerDown={handlePointerDown}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
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
