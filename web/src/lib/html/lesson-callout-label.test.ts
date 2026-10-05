import { describe, expect, it } from "vitest"

import {
  LESSON_CALLOUT_LABEL_PLACEHOLDER,
  resolveLessonCalloutLabel,
} from "./lesson-callout-label"

describe("resolveLessonCalloutLabel", () => {
  it("returns empty for missing, blank, and placeholder labels", () => {
    expect(resolveLessonCalloutLabel(null)).toBe("")
    expect(resolveLessonCalloutLabel(undefined)).toBe("")
    expect(resolveLessonCalloutLabel("")).toBe("")
    expect(resolveLessonCalloutLabel("   ")).toBe("")
    expect(resolveLessonCalloutLabel(LESSON_CALLOUT_LABEL_PLACEHOLDER)).toBe("")
  })

  it("preserves real callout titles", () => {
    expect(resolveLessonCalloutLabel("Example Argument #1:")).toBe("Example Argument #1:")
    expect(resolveLessonCalloutLabel("  Common trap  ")).toBe("Common trap")
  })
})
