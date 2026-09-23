/// <reference types="node" />

import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

import { buildAccessibilityContentStyle } from "@/features/student/practice-session/practice-session-accessibility"

const examCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

describe("buildAccessibilityContentStyle", () => {
  it("maps color scheme and typography settings to css variables", () => {
    expect(
      buildAccessibilityContentStyle({
        colorScheme: "white-on-black",
        fontScale: 1.1,
        zoomScale: 1.25,
        lineSpacing: 1.5,
      }),
    ).toMatchObject({
      "--practice-accessibility-bg": "#0d0d12",
      "--practice-accessibility-fg": "#ffffff",
      "--practice-choice-selected-bg": "#1c2433",
      "--practice-choice-selected-border": "#93c5fd",
      "--practice-choice-unselected-bg": "#252b38",
      "--practice-choice-unselected-border": "#3a4252",
      "--practice-choice-selected-letter-bg": "#ffffff",
      "--practice-choice-selected-letter-fg": "#0d0d12",
      "--practice-panel-bg": "#1c2433",
      "--practice-panel-border": "#3a4252",
      "--practice-panel-muted-fg": "#a4acb9",
      "--practice-font-scale": "1.1",
      "--practice-line-height-scale": "1.5",
      "--practice-zoom-scale": "1.25",
    })
  })

  it("maps purple-on-light-green foreground and background", () => {
    expect(
      buildAccessibilityContentStyle({
        colorScheme: "purple-on-light-green",
        fontScale: 1,
        zoomScale: 1,
        lineSpacing: 1,
      }),
    ).toMatchObject({
      "--practice-accessibility-bg": "#e8f8ef",
      "--practice-accessibility-fg": "#7b3fe4",
      "--practice-choice-selected-bg": "#f3eaff",
      "--practice-choice-selected-border": "#7b3fe4",
    })
  })

  it("keeps default black-on-white selected choice tokens", () => {
    expect(
      buildAccessibilityContentStyle({
        colorScheme: "black-on-white",
        fontScale: 1,
        zoomScale: 1,
        lineSpacing: 1,
      }),
    ).toMatchObject({
      "--practice-accessibility-bg": "#ffffff",
      "--practice-accessibility-fg": "#0d0d12",
      "--practice-choice-selected-bg": "#edf3ff",
      "--practice-choice-selected-border": "#0d47a1",
      "--practice-choice-selected-letter-bg": "#0d47a1",
      "--practice-choice-selected-letter-fg": "#f3f7ff",
      "--practice-choice-selected-letter-border": "#0b4e6e",
    })
  })
})

describe("accessibility panel layout", () => {
  it("sizes the dialog and tabs to their content without an inner scrollbar", async () => {
    const {
      PRACTICE_SESSION_ACCESSIBILITY_PANEL_BODY_CLASS,
      PRACTICE_SESSION_ACCESSIBILITY_PANEL_CLASS,
      PRACTICE_SESSION_ACCESSIBILITY_PANEL_TABS_CLASS,
    } = await import("@/features/student/practice-session/practice-session-accessibility-panel-styles")

    expect(PRACTICE_SESSION_ACCESSIBILITY_PANEL_CLASS).toContain("h-auto")
    expect(PRACTICE_SESSION_ACCESSIBILITY_PANEL_CLASS).not.toContain("overflow-hidden")
    expect(PRACTICE_SESSION_ACCESSIBILITY_PANEL_CLASS).not.toContain("max-h-[")
    expect(PRACTICE_SESSION_ACCESSIBILITY_PANEL_TABS_CLASS).toContain("h-auto")
    expect(PRACTICE_SESSION_ACCESSIBILITY_PANEL_TABS_CLASS).toContain("overflow-visible")
    expect(PRACTICE_SESSION_ACCESSIBILITY_PANEL_TABS_CLASS).not.toContain("overflow-x-auto")
    expect(PRACTICE_SESSION_ACCESSIBILITY_PANEL_BODY_CLASS).toContain("h-auto")
    expect(PRACTICE_SESSION_ACCESSIBILITY_PANEL_BODY_CLASS).not.toContain("overflow-y-auto")
  })
})

describe("official exam dark-mode choice ink", () => {
  it("uses Neutral-25 rows and white copy; selected peach keeps navy", () => {
    const marker =
      ".dark .practice-session-card--official .practice-session-official-choice:not(.practice-session-official-choice--selected)"
    const start = examCss.indexOf(marker)
    expect(start).toBeGreaterThan(-1)
    const unselected = examCss.slice(start, start + 700)
    expect(unselected).toContain("background-color: #35373c !important")
    expect(unselected).toContain("color: #ffffff !important")
    const selectedMarker =
      ".dark .practice-session-card--official .practice-session-official-choice--selected,"
    const selectedStart = examCss.indexOf(selectedMarker)
    expect(selectedStart).toBeGreaterThan(-1)
    expect(examCss.slice(selectedStart, selectedStart + 900)).toContain("color: #041a44 !important")
  })
})

describe("official exam Halyard Text", () => {
  it("loads Halyard Text Regular from a local woff2", () => {
    expect(examCss).toContain('font-family: "halyard-text"')
    expect(examCss).toContain('url("/fonts/HalyardText-Regular.woff2")')
    expect(examCss).toContain("font-weight: 300")
  })

  it("scales official A–E letters at 28px with the same font-size control as stems", () => {
    const marker = ".practice-session-card--official .practice-session-official-choice-letter {"
    const start = examCss.indexOf(marker)
    expect(start).toBeGreaterThan(-1)
    const block = examCss.slice(start, start + 280)
    expect(block).toContain("font-family: Apostrophe, halyard-text, sans-serif")
    expect(block).toContain("font-size: calc(28px * var(--practice-font-scale, 1))")
    expect(block).toContain("font-weight: 400")
  })
})

describe("exam chrome dark-mode glyphs", () => {
  it("inverts header and side-widget Figma icons to white", () => {
    const marker = ".dark .practice-session-header img,"
    const start = examCss.indexOf(marker)
    expect(start).toBeGreaterThan(-1)
    const block = examCss.slice(start, start + 280)
    expect(block).toContain(".dark .practice-session-side-widget img")
    expect(block).toContain("filter: brightness(0) invert(1)")
  })
})

describe("official highlighter stroke styles", () => {
  it("underlines applied official highlights: solid, spaced dash, tight dash, dotted", () => {
    const marker = ".practice-session-card--official .practice-session-content mark[data-highlight=\"yellow\"]"
    const start = examCss.indexOf(marker)
    expect(start).toBeGreaterThan(-1)
    const block = examCss.slice(start, examCss.indexOf("/* Marketing homepage"))
    expect(block).toContain("box-shadow: inset 0 -2px 0 #2c3143")
    expect(block).toContain("mark[data-highlight=\"pink\"]")
    expect(block).toContain("7px")
    expect(block).toContain("14px")
    expect(block).toContain("mark[data-highlight=\"green\"]")
    expect(block).toContain("3px")
    expect(block).toContain("5px")
    expect(block).toContain("mark[data-highlight=\"blue\"]")
    expect(block).toContain("radial-gradient")
    expect(block).toContain("u[data-underline=\"pink\"]")
    expect(block).toContain("text-decoration-style: dashed")
    expect(block).toContain("u[data-underline=\"blue\"]")
    expect(block).toContain("text-decoration-style: dotted")
  })
})
