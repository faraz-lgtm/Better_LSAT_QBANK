import { describe, expect, it } from "vitest"

import {
  getDefaultZoomScale,
  getNextZoomScale,
  getPreviousZoomScale,
  resolvePracticeSessionZoomShortcutAction,
} from "@/features/student/practice-session/practice-session-zoom-shortcuts"

describe("practice-session zoom shortcuts", () => {
  it("steps through zoom levels", () => {
    expect(getNextZoomScale(1)).toBe(1.1)
    expect(getNextZoomScale(1.5)).toBe(1.5)
    expect(getPreviousZoomScale(1.1)).toBe(1)
    expect(getDefaultZoomScale()).toBe(1)
  })

  it("resolves keyboard shortcuts", () => {
    expect(
      resolvePracticeSessionZoomShortcutAction({
        ctrlKey: true,
        metaKey: false,
        key: "=",
        code: "Equal",
      } as KeyboardEvent),
    ).toBe("zoom-in")

    expect(
      resolvePracticeSessionZoomShortcutAction({
        ctrlKey: true,
        metaKey: false,
        key: "-",
        code: "Minus",
      } as KeyboardEvent),
    ).toBe("zoom-out")

    expect(
      resolvePracticeSessionZoomShortcutAction({
        ctrlKey: true,
        metaKey: false,
        key: "0",
        code: "Digit0",
      } as KeyboardEvent),
    ).toBe("zoom-reset")
  })
})
