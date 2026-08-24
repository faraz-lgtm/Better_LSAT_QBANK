import { describe, expect, it } from "vitest"

import { buildAccessibilityContentStyle } from "@/features/student/practice-session/practice-session-accessibility"

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
      "--practice-choice-selected-bg": "#f3f7ff",
      "--practice-choice-selected-border": "#0d47a1",
      "--practice-choice-selected-letter-bg": "#0d47a1",
      "--practice-choice-selected-letter-fg": "#ffffff",
    })
  })
})
