export type HighlightColor = "orange" | "pink" | "yellow"

export type PracticeToolMode = "none" | "highlighter" | "eraser" | "underline"

export const HIGHLIGHT_COLORS: { id: HighlightColor; hex: string }[] = [
  { id: "orange", hex: "#FF6F00" },
  { id: "pink", hex: "#FFB4DE" },
  { id: "yellow", hex: "#FFBD4C" },
]

/** Same swatches as HIGHLIGHT_COLORS (kept for call sites that prefer an explicit active-drill export). */
export const ACTIVE_DRILL_HIGHLIGHT_COLORS: { id: HighlightColor; hex: string }[] = [
  { id: "orange", hex: "#FF6F00" },
  { id: "pink", hex: "#FFB4DE" },
  { id: "yellow", hex: "#FFBD4C" },
]

export type PracticeSessionVariant = "default" | "active-drill" | "blind-review"

export const FONT_SCALE_STEPS = [0.75, 1, 1.25, 1.5, 1.75] as const
export const LINE_SPACING_STEPS = [1, 1.25, 1.5] as const

export type RegionKey = string

/** Whether the student may pick a different option after already answering. */
export function canChangePracticeAnswer(
  showAnswers: string,
  hasAnswer: boolean,
  options?: { blindReview?: boolean },
): boolean {
  if (options?.blindReview) return true
  if (showAnswers === "each" && hasAnswer) return false
  return true
}
