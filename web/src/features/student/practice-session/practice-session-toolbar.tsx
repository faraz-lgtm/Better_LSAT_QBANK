import { Eraser } from "lucide-react"

import {
  FONT_SCALE_STEPS,
  HIGHLIGHT_COLORS,
  LINE_SPACING_STEPS,
  type HighlightColor,
  type PracticeToolMode,
} from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type PracticeSessionToolbarProps = {
  activeColor: HighlightColor | null
  toolMode: PracticeToolMode
  fontScale: number
  boldEnabled: boolean
  italicEnabled: boolean
  onSelectColor: (color: HighlightColor) => void
  onEraser: () => void
  onUnderline: () => void
  onFontSize: () => void
  onToggleBold: () => void
  onToggleItalic: () => void
}

const toolGroupClass =
  "flex h-[52px] items-center rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-3"
const toolBtnClass =
  "flex size-7 items-center justify-center rounded text-[#666d80] transition hover:bg-[#eceff3] hover:text-[#062357]"
const toolTextBtnClass =
  "flex size-7 items-center justify-center rounded text-xs font-bold text-[#666d80] transition hover:bg-[#eceff3] hover:text-[#062357]"

function PracticeSessionToolbar({
  activeColor,
  toolMode,
  fontScale,
  boldEnabled,
  italicEnabled,
  onSelectColor,
  onEraser,
  onUnderline,
  onFontSize,
  onToggleBold,
  onToggleItalic,
}: PracticeSessionToolbarProps) {
  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-2">
      <span className="hidden text-sm font-medium text-[#666d80] xl:inline">Tools:</span>
      <div className={cn(toolGroupClass, "gap-1.5")}>
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={cn(
              "size-7 shrink-0 rounded border-2 border-transparent",
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
          className={cn(toolBtnClass, toolMode === "eraser" && "bg-[#eceff3] text-[#062357]")}
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
        <button
          type="button"
          className={cn(toolTextBtnClass, "underline", toolMode === "underline" && "bg-[#eceff3] text-[#062357]")}
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
