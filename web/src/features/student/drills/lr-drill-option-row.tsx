import { memo, useRef, type KeyboardEvent, type PointerEvent } from "react"
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"

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
import {
  OFFICIAL_OPTION_LETTER_SELECTED_CLASS,
  OFFICIAL_OPTION_LETTER_UNSELECTED_CLASS,
  OFFICIAL_OPTION_ROW_MASKED_CLASS,
  OFFICIAL_OPTION_ROW_SELECTED_CLASS,
  OFFICIAL_OPTION_ROW_UNSELECTED_CLASS,
  OFFICIAL_OPTION_SELECTED_BAR_CLASS,
  OFFICIAL_OPTION_TEXT_CLASS,
} from "@/features/student/practice-session/practice-session-official-styles"
import type { BlindReviewAnswerView } from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import {
  BLIND_REVIEW_OPTION_LETTER_CORRECT_CLASS,
  BLIND_REVIEW_OPTION_LETTER_SELECTED_ACTUAL_CLASS,
  BLIND_REVIEW_OPTION_LETTER_SELECTED_BR_CLASS,
  BLIND_REVIEW_OPTION_ROW_CORRECT_CLASS,
  BLIND_REVIEW_OPTION_ROW_INNER_CLASS,
  BLIND_REVIEW_OPTION_ROW_SELECTED_ACTUAL_CLASS,
  BLIND_REVIEW_OPTION_ROW_SELECTED_BR_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import type { PracticeSessionVariant, RegionKey } from "@/features/student/practice-session/practice-session-types"
import { isOfficialLayout } from "@/features/student/practice-session/practice-session-types"
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
  explanationPercent?: number | null
  onToggleExplanation?: () => void
  /** Review chrome — teal correct-answer highlight (overrides selected blue/orange). */
  correctHighlight?: boolean
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
  explanationPercent = null,
  onToggleExplanation,
  correctHighlight = false,
}: LrDrillOptionRowProps) {
  const letter = letters[index] ?? String(index + 1)
  const officialChrome = isOfficialLayout(variant)
  const isActiveDrill = variant === "active-drill"
  const isBlindReview = variant === "blind-review"
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const hasExplanation = Boolean(explanationHtml?.trim())
  const useActualSelectedStyles = answerView === "actual" || answerView === "clean"
  const brSelectedRowClass = correctHighlight
    ? BLIND_REVIEW_OPTION_ROW_CORRECT_CLASS
    : useActualSelectedStyles
      ? BLIND_REVIEW_OPTION_ROW_SELECTED_ACTUAL_CLASS
      : BLIND_REVIEW_OPTION_ROW_SELECTED_BR_CLASS
  const brSelectedLetterClass = correctHighlight
    ? BLIND_REVIEW_OPTION_LETTER_CORRECT_CLASS
    : useActualSelectedStyles
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
        isActiveDrill
          ? "text-sm font-normal leading-[1.5] tracking-[0.28px] text-[color:inherit]"
          : officialChrome
            ? "text-[14px] font-normal leading-5 text-[var(--color-student-heading)]"
            : isBlindReview
            ? "text-pretty text-[1em] leading-[1.5] tracking-[0.32px] text-[color:inherit]"
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

    if (masked) onToggleMasked?.()
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
    const isMasked = masked
    return (
      <div
        className={cn(
          "practice-session-br-option h-auto shrink-0 overflow-visible rounded-[14px] border transition-colors",
          explanationAction
            ? selected || correctHighlight
              ? brSelectedRowClass
              : "border-transparent bg-[var(--greyscale-25)]"
            : selected
              ? brSelectedRowClass
              : hidden || isMasked
                ? "border border-[var(--greyscale-100)] bg-[var(--greyscale-50)]"
                : "border border-[var(--greyscale-100)] bg-[var(--greyscale-25)]",
          isMasked && "practice-session-choice-masked opacity-45",
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
            explanationAction
              ? "flex items-start justify-between gap-4 py-2 pl-2 pr-6 text-left text-sm font-normal leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]"
              : cn(BLIND_REVIEW_OPTION_ROW_INNER_CLASS, "text-[var(--color-student-heading)]"),
            !explanationAction && (disabled ? "cursor-default" : "cursor-pointer"),
          )}
        >
          <div className={cn("flex min-w-0 flex-1 items-start", explanationAction ? "gap-3" : "gap-4")}>
            <span
              className={cn(
                "flex shrink-0 self-start items-center justify-center font-bold",
                explanationAction ? "size-[46px] rounded-[12px] text-sm tracking-[0.28px]" : "size-12 rounded-[14px] text-lg",
                selected || correctHighlight
                  ? brSelectedLetterClass
                  : explanationAction
                    ? "bg-[var(--greyscale-0)] text-[var(--color-student-heading)]"
                    : "bg-[var(--greyscale-0)] text-[var(--greyscale-500)]",
                (hidden || isMasked) && "line-through",
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
                "mt-1 inline-flex size-5 shrink-0 self-start items-center justify-center transition",
                explanationExpanded
                  ? "text-[var(--primary)]"
                  : "text-[var(--greyscale-500)] hover:text-[var(--color-student-heading)]",
              )}
              aria-label={
                explanationExpanded
                  ? `Hide explanation for choice ${letter}`
                  : `Show explanation for choice ${letter}`
              }
              aria-expanded={explanationExpanded}
              onClick={(e) => {
                e.stopPropagation()
                onToggleExplanation?.()
              }}
            >
              {explanationExpanded ? (
                <ChevronUp className="size-5" strokeWidth={2} aria-hidden />
              ) : (
                <ChevronDown className="size-5" strokeWidth={2} aria-hidden />
              )}
            </button>
          ) : showSideAction ? (
            <button
              type="button"
              className="mt-1.5 inline-flex size-5 shrink-0 self-start items-center justify-center text-[var(--greyscale-500)] transition hover:text-[var(--color-student-heading)]"
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
          ) : null}
        </div>
        {explanationAction && explanationExpanded ? (
          <div className="mx-0 mb-0 mt-[10px] flex w-full items-start justify-between rounded-[14px] bg-[var(--greyscale-0)] p-6 text-left">
            <div className="min-w-0 flex-1 pr-6 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">
            {hasExplanation ? (
              <HtmlContent
                html={explanationHtml ?? ""}
                className="explanation-review-body text-[var(--color-student-heading)]"
              />
            ) : (
              <p className="m-0">
                No answer explanation available yet.
              </p>
            )}
            </div>
            {explanationPercent != null ? (
              <div className="flex shrink-0 flex-col items-center gap-1">
                <p className="m-0 h-[15px] text-xs font-medium leading-[1.5] tracking-[0.24px] text-[var(--color-student-heading)]">
                  {Math.round(explanationPercent)}%
                </p>
                <div className="flex h-14 w-6 items-end justify-center overflow-hidden rounded-[6px] border border-[var(--greyscale-100)] bg-[var(--primary-0)]/60">
                  <div
                    className="w-full rounded-t-[10px] bg-gradient-to-t from-[var(--student-meter-light)] to-[var(--primary)]"
                    style={{ height: `${Math.max(4, Math.min(56, Math.round(explanationPercent)))}px` }}
                    aria-hidden
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  if (officialChrome) {
    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={selected && !masked}
        aria-disabled={disabled}
        onPointerDown={handlePointerDown}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        className={cn(
          "text-left",
          masked
            ? OFFICIAL_OPTION_ROW_MASKED_CLASS
            : selected
              ? OFFICIAL_OPTION_ROW_SELECTED_CLASS
              : OFFICIAL_OPTION_ROW_UNSELECTED_CLASS,
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
        {selected && !masked ? <span aria-hidden className={OFFICIAL_OPTION_SELECTED_BAR_CLASS} /> : null}
        <span
          className={cn(
            selected && !masked ? OFFICIAL_OPTION_LETTER_SELECTED_CLASS : OFFICIAL_OPTION_LETTER_UNSELECTED_CLASS,
            masked && "practice-session-choice-masked-ink",
          )}
        >
          {letter}
        </span>
        <div className={cn(OFFICIAL_OPTION_TEXT_CLASS, masked && "practice-session-choice-masked-ink")}>
          {choiceContent}
        </div>
      </div>
    )
  }

  if (isActiveDrill) {
    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={selected && !masked}
        aria-disabled={disabled}
        onPointerDown={handlePointerDown}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        className={cn(
          showSideAction ? ACTIVE_DRILL_CHOICE_ROW_GRID_WITH_ACTION_CLASS : ACTIVE_DRILL_CHOICE_ROW_GRID_CLASS,
          "text-left transition-[background-color,box-shadow,border-color]",
          masked
            ? ACTIVE_DRILL_OPTION_ROW_MASKED_CLASS
            : selected
              ? ACTIVE_DRILL_OPTION_ROW_SELECTED_CLASS
              : ACTIVE_DRILL_OPTION_ROW_UNSELECTED_CLASS,
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
            "flex items-center justify-center self-start",
            selected && !masked
              ? ACTIVE_DRILL_OPTION_LETTER_SELECTED_CLASS
              : ACTIVE_DRILL_OPTION_LETTER_UNSELECTED_CLASS,
            masked && "practice-session-choice-masked-ink",
          )}
        >
          {letter}
        </span>
        <div className={cn("min-w-0 flex-1 self-start", masked && "practice-session-choice-masked-ink")}>
          {choiceContent}
        </div>
        {showSideAction ? (
          <button
            type="button"
            className={cn(ACTIVE_DRILL_OPTION_EYE_BUTTON_CLASS, "ml-auto self-start")}
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
