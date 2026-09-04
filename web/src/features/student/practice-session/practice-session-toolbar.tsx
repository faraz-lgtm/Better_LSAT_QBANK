import { AlignVerticalSpaceAround, Eraser } from "lucide-react"

import {
  ACTIVE_DRILL_HEADER_TOOL_GROUP_CLASS,
  ACTIVE_DRILL_HEADER_UNDERLINE_BUTTON_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import {
  FONT_SCALE_STEPS,
  HIGHLIGHT_COLORS,
  LINE_SPACING_STEPS,
  type HighlightColor,
  type PracticeSessionVariant,
  type PracticeToolMode,
} from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type PracticeSessionToolbarProps = {
  variant?: PracticeSessionVariant
  activeColor: HighlightColor | null
  toolMode: PracticeToolMode
  fontScale: number
  lineSpacing?: number
  boldEnabled: boolean
  italicEnabled: boolean
  onSelectColor: (color: HighlightColor) => void
  onEraser: () => void
  onUnderline: () => void
  onFontSize: () => void
  onLineSpacing?: () => void
  onToggleBold: () => void
  onToggleItalic: () => void
}

const toolBtnClass =
  "flex size-7 items-center justify-center rounded text-[var(--greyscale-500)] transition hover:bg-[var(--greyscale-50)] hover:text-[var(--color-student-heading)]"
const toolTextBtnClass =
  "flex size-7 items-center justify-center rounded text-xs font-bold text-[var(--greyscale-500)] transition hover:bg-[var(--greyscale-50)] hover:text-[var(--color-student-heading)]"

function PracticeSessionToolbar({
  variant = "default",
  activeColor,
  toolMode,
  fontScale,
  lineSpacing = 1,
  boldEnabled,
  italicEnabled,
  onSelectColor,
  onEraser,
  onUnderline,
  onFontSize,
  onLineSpacing,
  onToggleBold,
  onToggleItalic,
}: PracticeSessionToolbarProps) {
  const isActiveDrill = variant === "active-drill"
  const isBlindReview = variant === "blind-review"
  const useDrillToolbar = isActiveDrill || isBlindReview

  if (isActiveDrill) {
    return (
      <div className="flex shrink-0 flex-nowrap items-center gap-2.5">
        <span className="shrink-0 text-sm font-medium tracking-[0.28px] text-[var(--greyscale-500)]">Tools:</span>
        <div className={ACTIVE_DRILL_HEADER_TOOL_GROUP_CLASS}>
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cn(
                "size-7 shrink-0 rounded-[4px] border-2 border-transparent",
                activeColor === c.id && toolMode === "highlighter" && "border-[var(--color-student-heading)]",
              )}
              style={{ backgroundColor: c.hex }}
              aria-label={`Highlighter ${c.id}`}
              aria-pressed={activeColor === c.id && toolMode === "highlighter"}
              onClick={() => onSelectColor(c.id)}
            />
          ))}
          <div className="mx-0.5 h-6 w-px shrink-0 bg-[var(--greyscale-100)] dark:bg-[var(--greyscale-600)]" aria-hidden />
          <button
            type="button"
            className={cn(
              "inline-flex size-7 items-center justify-center rounded text-[var(--greyscale-500)] transition hover:text-[var(--color-student-heading)]",
              toolMode === "eraser" && "bg-[var(--greyscale-50)] text-[var(--color-student-heading)]",
            )}
            aria-label="Eraser"
            aria-pressed={toolMode === "eraser"}
            onClick={onEraser}
          >
            <Eraser className="size-6" strokeWidth={2} />
          </button>
        </div>
        <button
          type="button"
          className={cn(
            ACTIVE_DRILL_HEADER_UNDERLINE_BUTTON_CLASS,
            "underline",
            toolMode === "underline" && "bg-[var(--greyscale-50)] text-[var(--color-student-heading)]",
          )}
          aria-label="Underline"
          aria-pressed={toolMode === "underline"}
          onClick={onUnderline}
        >
          U
        </button>
      </div>
    )
  }

  const swatches = HIGHLIGHT_COLORS
  const toolGroupClass = useDrillToolbar
    ? ACTIVE_DRILL_HEADER_TOOL_GROUP_CLASS
    : "flex h-[52px] items-center rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-3"

  return (
    <div className={cn("flex shrink-0 flex-nowrap items-center", useDrillToolbar ? "gap-2.5" : "gap-2")}>
      <span
        className={cn(
          "shrink-0 text-sm font-medium tracking-[0.28px] text-[var(--greyscale-500)]",
          useDrillToolbar ? "inline" : "hidden xl:inline",
        )}
      >
        Tools:
      </span>
      <div className={cn(toolGroupClass, "gap-1.5")}>
        {swatches.map((c) => (
          <button
            key={c.id}
            type="button"
            className={cn(
              "size-7 shrink-0 rounded-[4px] border-2 border-transparent",
              activeColor === c.id && toolMode === "highlighter" && "border-[var(--color-student-heading)]",
            )}
            style={{ backgroundColor: c.hex }}
            aria-label={`Highlighter ${c.id}`}
            aria-pressed={activeColor === c.id && toolMode === "highlighter"}
            onClick={() => onSelectColor(c.id)}
          />
        ))}
        <div className="mx-0.5 h-6 w-px shrink-0 bg-[var(--greyscale-100)] dark:bg-[var(--greyscale-600)]" aria-hidden />
        <button
          type="button"
          className={cn(toolBtnClass, toolMode === "eraser" && "bg-[var(--greyscale-50)] text-[var(--color-student-heading)]")}
          aria-label="Eraser"
          aria-pressed={toolMode === "eraser"}
          onClick={onEraser}
        >
          <Eraser className="size-4" strokeWidth={2} />
        </button>
      </div>
      <div className={cn(toolGroupClass, "gap-1")}>
        <button type="button" className={toolTextBtnClass} aria-label="Text size" onClick={onFontSize}>
          Aa
          <span className="sr-only"> ({fontScale}x)</span>
        </button>
        {useDrillToolbar ? (
          <button
            type="button"
            className={cn(toolBtnClass, lineSpacing !== 1 && "bg-[var(--greyscale-50)] text-[var(--color-student-heading)]")}
            aria-label="Line spacing"
            onClick={onLineSpacing}
          >
            <AlignVerticalSpaceAround className="size-4" strokeWidth={2} />
            <span className="sr-only"> ({lineSpacing})</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className={cn(toolTextBtnClass, boldEnabled && "bg-[var(--greyscale-50)] text-[var(--color-student-heading)]")}
              aria-label="Bold"
              aria-pressed={boldEnabled}
              onClick={onToggleBold}
            >
              B
            </button>
            <button
              type="button"
              className={cn(toolTextBtnClass, "italic", italicEnabled && "bg-[var(--greyscale-50)] text-[var(--color-student-heading)]")}
              aria-label="Italic"
              aria-pressed={italicEnabled}
              onClick={onToggleItalic}
            >
              I
            </button>
          </>
        )}
        <button
          type="button"
          className={cn(
            toolTextBtnClass,
            "underline",
            toolMode === "underline" && "bg-[var(--greyscale-50)] text-[var(--color-student-heading)]",
          )}
          aria-label="Underline"
          aria-pressed={toolMode === "underline"}
          onClick={onUnderline}
        >
          U
        </button>
      </div>
    </div>
  )
}

export { PracticeSessionToolbar, FONT_SCALE_STEPS, LINE_SPACING_STEPS }
