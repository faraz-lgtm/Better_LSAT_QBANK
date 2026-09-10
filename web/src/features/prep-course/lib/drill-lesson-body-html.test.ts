import { describe, expect, it } from "vitest"

import { drillLessonHasBodyHtml } from "./drill-lesson-body-html"

describe("drillLessonHasBodyHtml", () => {
  it("is false for empty or blank paragraphs", () => {
    expect(drillLessonHasBodyHtml(null)).toBe(false)
    expect(drillLessonHasBodyHtml("<p></p>")).toBe(false)
    expect(drillLessonHasBodyHtml("<p>&nbsp;</p>")).toBe(false)
  })

  it("is true for uploaded headings, lists, and text", () => {
    expect(drillLessonHasBodyHtml("<h3>Stimulus Analysis</h3><p>Florist: Some people like green carnations.</p>")).toBe(
      true,
    )
    expect(drillLessonHasBodyHtml("<ol><li>It is a good idea to have green carnations.</li></ol>")).toBe(true)
  })
})
