export type HighlightColor = "orange" | "pink" | "yellow"

export type PracticeToolMode = "none" | "highlighter" | "eraser" | "underline"

export const HIGHLIGHT_COLORS: { id: HighlightColor; hex: string }[] = [
  { id: "orange", hex: "#FF6F00" },
  { id: "pink", hex: "#FFB4DE" },
  { id: "yellow", hex: "#FFBD4C" },
]

/** Figma active drill header swatches (`18617:31527`) — same ids, cyan-first display. */
export const ACTIVE_DRILL_HIGHLIGHT_COLORS: { id: HighlightColor; hex: string }[] = [
  { id: "orange", hex: "#0BBCC9" },
  { id: "pink", hex: "#FFB4DE" },
  { id: "yellow", hex: "#FFBD4C" },
]

export type PracticeSessionVariant = "default" | "active-drill"

export const FONT_SCALE_STEPS = [0.9, 1, 1.1, 1.2] as const
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
