export type HighlightColor = "orange" | "pink" | "yellow" | "green" | "blue"

export type PassageHighlightColor = Exclude<HighlightColor, "orange">

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

/** Passage selection popover — yellow / pink / green / blue (Figma `20280:108155` highlight UI). */
export const PASSAGE_HIGHLIGHT_COLORS: { id: PassageHighlightColor; hex: string; border: string }[] = [
  { id: "yellow", hex: "#FEF095", border: "#C4A63A" },
  { id: "pink", hex: "#FFE2E2", border: "#E07070" },
  { id: "green", hex: "#AFE9C7", border: "#4D9A6E" },
  { id: "blue", hex: "#A6E1FD", border: "#4AA3D4" },
]

export function isPassageHighlightColor(value: string | null | undefined): value is PassageHighlightColor {
  return value === "yellow" || value === "pink" || value === "green" || value === "blue"
}

/** BetterLSAT exam chrome (`active-drill`, Figma header `20268:105580`, footer `20268:107659`). Official LawHub view is `official` (Figma `20255:49920` full page) and is the product default. */
export type PracticeSessionVariant = "default" | "active-drill" | "blind-review" | "official"

export function isExamChromeLayout(variant: PracticeSessionVariant | undefined): boolean {
  return variant === "active-drill" || variant === "official"
}

export function isOfficialLayout(variant: PracticeSessionVariant | undefined): boolean {
  return variant === "official"
}

export function resolveExamSessionVariant(options: {
  blindReview: boolean
  officialInterface: boolean
}): PracticeSessionVariant {
  if (options.blindReview) return "blind-review"
  if (options.officialInterface) return "official"
  return "active-drill"
}

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
