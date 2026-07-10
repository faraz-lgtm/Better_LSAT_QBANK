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

const ZOOM_SCALE_STEPS = [1, 1.1, 1.25, 1.5] as const

const DEFAULT_ACCESSIBILITY_SETTINGS: PracticeSessionAccessibilitySettings = {
  colorScheme: "black-on-white",
  fontScale: 1,
  zoomScale: 1,
  lineSpacing: 1,
}

const PRACTICE_SESSION_COLOR_SCHEMES: ReadonlyArray<{
  id: PracticeSessionColorSchemeId
  label: string
  backgroundColor: string
  color: string
}> = [
  { id: "black-on-white", label: "Black on white (default)", backgroundColor: "#ffffff", color: "#0d0d12" },
  { id: "grey-on-light-grey", label: "Grey on light grey", backgroundColor: "#f6f8fa", color: "#666d80" },
  { id: "purple-on-light-green", label: "Purple on light green", backgroundColor: "#e8f8ef", color: "#7b3fe4" },
  { id: "black-on-violet", label: "Black on violet", backgroundColor: "#f3f0ff", color: "#0d0d12" },
  { id: "yellow-on-navy", label: "Yellow on navy", backgroundColor: "#0d47a1", color: "#ffbd4c" },
  { id: "white-on-black", label: "White on black", backgroundColor: "#0d0d12", color: "#ffffff" },
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
