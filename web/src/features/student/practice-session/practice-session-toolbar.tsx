import { AlignVerticalSpaceAround, Eraser } from "lucide-react"

import {
  FONT_SCALE_STEPS,
  HIGHLIGHT_COLORS,
  ACTIVE_DRILL_HIGHLIGHT_COLORS,
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
  "flex size-7 items-center justify-center rounded text-[#666d80] transition hover:bg-[#eceff3] hover:text-[#062357]"
const toolTextBtnClass =
  "flex size-7 items-center justify-center rounded text-xs font-bold text-[#666d80] transition hover:bg-[#eceff3] hover:text-[#062357]"
const activeDrillToolGroupClass =
  "flex h-[52px] items-center rounded-[16px] border border-[#dfe1e7] bg-white"

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
  const swatches = isActiveDrill ? ACTIVE_DRILL_HIGHLIGHT_COLORS : HIGHLIGHT_COLORS
  const toolGroupClass = useDrillToolbar
    ? activeDrillToolGroupClass
    : "flex h-[52px] items-center rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-3"

  return (
    <div className={cn("flex shrink-0 flex-nowrap items-center", useDrillToolbar ? "gap-2.5" : "gap-2")}>
      <span
        className={cn(
          "shrink-0 text-sm font-medium tracking-[0.28px] text-[#666d80]",
          useDrillToolbar ? "inline" : "hidden xl:inline",
        )}
      >
        Tools:
      </span>
      <div className={cn(toolGroupClass, useDrillToolbar ? "gap-1.5 px-3" : "gap-1.5")}>
        {swatches.map((c) => (
          <button
            key={c.id}
            type="button"
            className={cn(
              "shrink-0 rounded-[4px] border-2 border-transparent",
              useDrillToolbar ? "size-7" : "size-7 rounded border-2",
              activeColor === c.id && toolMode === "highlighter" && "border-[#062357]",
            )}
            style={{ backgroundColor: c.hex }}
            aria-label={`Highlighter ${c.id}`}
            aria-pressed={activeColor === c.id && toolMode === "highlighter"}
            onClick={() => onSelectColor(c.id)}
          />
        ))}
        <div className="mx-0.5 h-6 w-px shrink-0 bg-[#dfe1e7]" aria-hidden />
        <button
          type="button"
          className={cn(
            toolBtnClass,
            useDrillToolbar && "size-7",
            toolMode === "eraser" && "bg-[#eceff3] text-[#062357]",
          )}
          aria-label="Eraser"
          aria-pressed={toolMode === "eraser"}
          onClick={onEraser}
        >
          <Eraser className={cn(useDrillToolbar ? "size-6" : "size-4")} strokeWidth={2} />
        </button>
      </div>
      <div className={cn(toolGroupClass, useDrillToolbar ? "gap-1 px-[13px]" : "gap-1")}>
        <button type="button" className={cn(toolTextBtnClass, useDrillToolbar && "size-7")} aria-label="Text size" onClick={onFontSize}>
          Aa
          <span className="sr-only"> ({fontScale}x)</span>
        </button>
        {useDrillToolbar ? (
          <button
            type="button"
            className={cn(toolBtnClass, "size-7", lineSpacing !== 1 && "bg-[#eceff3] text-[#062357]")}
            aria-label="Line spacing"
            onClick={onLineSpacing}
          >
            <AlignVerticalSpaceAround className="size-6" strokeWidth={2} />
            <span className="sr-only"> ({lineSpacing})</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className={cn(toolTextBtnClass, boldEnabled && "bg-[#eceff3] text-[#062357]")}
              aria-label="Bold"
              aria-pressed={boldEnabled}
              onClick={onToggleBold}
            >
              B
            </button>
            <button
              type="button"
              className={cn(toolTextBtnClass, "italic", italicEnabled && "bg-[#eceff3] text-[#062357]")}
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
            useDrillToolbar && "size-7",
            toolMode === "underline" && "bg-[#eceff3] text-[#062357]",
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
