import type { CSSProperties } from "react"

import {
  FONT_SCALE_STEPS,
  LINE_SPACING_STEPS,
} from "@/features/student/practice-session/practice-session-types"

type PracticeSessionColorSchemeId =
  | "black-on-white"
  | "grey-on-light-grey"
  | "purple-on-light-green"
  | "black-on-violet"
  | "yellow-on-navy"
  | "white-on-black"

type PracticeSessionAccessibilityTab = "color-scheme" | "font-size" | "zoom" | "line-height"

type PracticeSessionAccessibilitySettings = {
  colorScheme: PracticeSessionColorSchemeId
  fontScale: number
  zoomScale: number
  lineSpacing: number
}

type PracticeSessionColorScheme = {
  id: PracticeSessionColorSchemeId
  label: string
  backgroundColor: string
  color: string
  /** Selected answer row + letter badge — keep contrast with scheme text. */
  choiceSelectedBg: string
  choiceSelectedBorder: string
  choiceSelectedLetterBg: string
  choiceSelectedLetterFg: string
  /** Defaults to letter fill when omitted. */
  choiceSelectedLetterBorder?: string
  /** Unselected answer row — must contrast with scheme text (not a leftover light card). */
  choiceUnselectedBg: string
  choiceUnselectedBorder: string
  choiceUnselectedLetterBg: string
  choiceUnselectedLetterFg: string
  choiceUnselectedLetterBorder: string
  /** Nested panels (explanations, callouts) — elevated surface vs page bg. */
  panelBg: string
  panelBorder: string
  panelMutedFg: string
}

const ZOOM_SCALE_STEPS = [1, 1.1, 1.25, 1.5] as const

const DEFAULT_ACCESSIBILITY_SETTINGS: PracticeSessionAccessibilitySettings = {
  colorScheme: "black-on-white",
  fontScale: 1,
  zoomScale: 1,
  lineSpacing: 1,
}

const PRACTICE_SESSION_COLOR_SCHEMES: ReadonlyArray<PracticeSessionColorScheme> = [
  {
    id: "black-on-white",
    label: "Black on white (default)",
    backgroundColor: "#ffffff",
    color: "#0d0d12",
    choiceSelectedBg: "#edf3ff",
    choiceSelectedBorder: "#0d47a1",
    choiceSelectedLetterBg: "#0d47a1",
    choiceSelectedLetterFg: "#f3f7ff",
    choiceSelectedLetterBorder: "#0b4e6e",
    choiceUnselectedBg: "#f6f8fa",
    choiceUnselectedBorder: "transparent",
    choiceUnselectedLetterBg: "#ffffff",
    choiceUnselectedLetterFg: "#000000",
    choiceUnselectedLetterBorder: "transparent",
    panelBg: "#f6f8fa",
    panelBorder: "#dfe1e7",
    panelMutedFg: "#666d80",
  },
  {
    id: "grey-on-light-grey",
    label: "Grey on light grey",
    backgroundColor: "#f6f8fa",
    color: "#666d80",
    choiceSelectedBg: "#e8edf5",
    choiceSelectedBorder: "#666d80",
    choiceSelectedLetterBg: "#666d80",
    choiceSelectedLetterFg: "#ffffff",
    choiceUnselectedBg: "#ffffff",
    choiceUnselectedBorder: "transparent",
    choiceUnselectedLetterBg: "#ffffff",
    choiceUnselectedLetterFg: "#666d80",
    choiceUnselectedLetterBorder: "#dfe1e7",
    panelBg: "#ffffff",
    panelBorder: "#dfe1e7",
    panelMutedFg: "#666d80",
  },
  {
    id: "purple-on-light-green",
    label: "Purple on light green",
    backgroundColor: "#e8f8ef",
    color: "#7b3fe4",
    choiceSelectedBg: "#f3eaff",
    choiceSelectedBorder: "#7b3fe4",
    choiceSelectedLetterBg: "#7b3fe4",
    choiceSelectedLetterFg: "#ffffff",
    choiceUnselectedBg: "#ffffff",
    choiceUnselectedBorder: "transparent",
    choiceUnselectedLetterBg: "#ffffff",
    choiceUnselectedLetterFg: "#7b3fe4",
    choiceUnselectedLetterBorder: "#cbb8f5",
    panelBg: "#dff5e9",
    panelBorder: "#b7e4c7",
    panelMutedFg: "#5a36a8",
  },
  {
    id: "black-on-violet",
    label: "Black on violet",
    backgroundColor: "#f3f0ff",
    color: "#0d0d12",
    choiceSelectedBg: "#e7e0ff",
    choiceSelectedBorder: "#0d0d12",
    choiceSelectedLetterBg: "#0d0d12",
    choiceSelectedLetterFg: "#ffffff",
    choiceUnselectedBg: "#ffffff",
    choiceUnselectedBorder: "transparent",
    choiceUnselectedLetterBg: "#ffffff",
    choiceUnselectedLetterFg: "#0d0d12",
    choiceUnselectedLetterBorder: "#d4cbf5",
    panelBg: "#ebe6ff",
    panelBorder: "#d4cbf5",
    panelMutedFg: "#666d80",
  },
  {
    id: "yellow-on-navy",
    label: "Yellow on navy",
    backgroundColor: "#0d47a1",
    color: "#ffbd4c",
    choiceSelectedBg: "#0a3a82",
    choiceSelectedBorder: "#ffbd4c",
    choiceSelectedLetterBg: "#ffbd4c",
    choiceSelectedLetterFg: "#0d47a1",
    choiceUnselectedBg: "#0a3a82",
    choiceUnselectedBorder: "#0a3a82",
    choiceUnselectedLetterBg: "#0a3a82",
    choiceUnselectedLetterFg: "#ffbd4c",
    choiceUnselectedLetterBorder: "#ffbd4c",
    panelBg: "#0a3a82",
    panelBorder: "#ffbd4c",
    panelMutedFg: "#ffd78a",
  },
  {
    id: "white-on-black",
    label: "White on black",
    backgroundColor: "#0d0d12",
    color: "#ffffff",
    choiceSelectedBg: "#1c2433",
    choiceSelectedBorder: "#93c5fd",
    choiceSelectedLetterBg: "#ffffff",
    choiceSelectedLetterFg: "#0d0d12",
    choiceUnselectedBg: "#252b38",
    choiceUnselectedBorder: "#3a4252",
    choiceUnselectedLetterBg: "#ffffff",
    choiceUnselectedLetterFg: "#0d0d12",
    choiceUnselectedLetterBorder: "#ffffff",
    panelBg: "#1c2433",
    panelBorder: "#3a4252",
    panelMutedFg: "#a4acb9",
  },
]

const FONT_SIZE_LABELS: Record<(typeof FONT_SCALE_STEPS)[number], string> = {
  0.75: "Small (75%)",
  1: "Normal (100%)",
  1.25: "Large (125%)",
  1.5: "Extra large (150%)",
  1.75: "Huge (175%)",
}

/** Figma font-size tab — scale steps with preview + percentage labels */
const FONT_SIZE_OPTIONS: ReadonlyArray<{ value: number; label: string }> = FONT_SCALE_STEPS.map((value) => ({
  value,
  label: FONT_SIZE_LABELS[value],
}))

const ZOOM_OPTIONS = ZOOM_SCALE_STEPS.map((value) => ({
  value,
  label: `${Math.round(value * 100)}%`,
}))

const LINE_HEIGHT_OPTIONS = LINE_SPACING_STEPS.map((value) => ({
  value,
  label: value === 1 ? "Default" : value === 1.25 ? "Comfortable" : "Spacious",
}))

function getAccessibilityCssVariables(
  settings: Pick<PracticeSessionAccessibilitySettings, "colorScheme">,
): CSSProperties {
  const scheme =
    PRACTICE_SESSION_COLOR_SCHEMES.find((entry) => entry.id === settings.colorScheme) ??
    PRACTICE_SESSION_COLOR_SCHEMES[0]!

  return {
    ["--practice-accessibility-bg" as string]: scheme.backgroundColor,
    ["--practice-accessibility-fg" as string]: scheme.color,
    ["--practice-choice-selected-bg" as string]: scheme.choiceSelectedBg,
    ["--practice-choice-selected-border" as string]: scheme.choiceSelectedBorder,
    ["--practice-choice-selected-letter-bg" as string]: scheme.choiceSelectedLetterBg,
    ["--practice-choice-selected-letter-fg" as string]: scheme.choiceSelectedLetterFg,
    ["--practice-choice-selected-letter-border" as string]:
      scheme.choiceSelectedLetterBorder ?? scheme.choiceSelectedLetterBg,
    ["--practice-choice-unselected-bg" as string]: scheme.choiceUnselectedBg,
    ["--practice-choice-unselected-border" as string]: scheme.choiceUnselectedBorder,
    ["--practice-choice-unselected-letter-bg" as string]: scheme.choiceUnselectedLetterBg,
    ["--practice-choice-unselected-letter-fg" as string]: scheme.choiceUnselectedLetterFg,
    ["--practice-choice-unselected-letter-border" as string]: scheme.choiceUnselectedLetterBorder,
    ["--practice-panel-bg" as string]: scheme.panelBg,
    ["--practice-panel-border" as string]: scheme.panelBorder,
    ["--practice-panel-muted-fg" as string]: scheme.panelMutedFg,
  }
}

function buildAccessibilityContentStyle(
  settings: PracticeSessionAccessibilitySettings,
  options?: { boldEnabled?: boolean; italicEnabled?: boolean },
): CSSProperties {
  return {
    ...getAccessibilityCssVariables(settings),
    ["--practice-font-scale" as string]: String(settings.fontScale),
    ["--practice-line-height-scale" as string]: String(settings.lineSpacing),
    ["--practice-zoom-scale" as string]: String(settings.zoomScale),
    fontWeight: options?.boldEnabled ? 700 : undefined,
    fontStyle: options?.italicEnabled ? "italic" : undefined,
  }
}

export {
  buildAccessibilityContentStyle,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  FONT_SIZE_OPTIONS,
  getAccessibilityCssVariables,
  LINE_HEIGHT_OPTIONS,
  PRACTICE_SESSION_COLOR_SCHEMES,
  ZOOM_OPTIONS,
  ZOOM_SCALE_STEPS,
  type PracticeSessionAccessibilitySettings,
  type PracticeSessionAccessibilityTab,
  type PracticeSessionColorSchemeId,
}
