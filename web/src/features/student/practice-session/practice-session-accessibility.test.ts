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
    })
  })
})
