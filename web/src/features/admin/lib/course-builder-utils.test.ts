import { describe, expect, it } from "vitest"

import { appendLessonHtmlBlock } from "@/features/admin/lib/course-builder-utils"

describe("appendLessonHtmlBlock", () => {
  it("uses an empty paragraph when existing content is blank", () => {
    expect(appendLessonHtmlBlock("", "<hr><p></p>")).toBe("<p></p><hr><p></p>")
  })

  it("appends a divider after existing lesson body html", () => {
    expect(appendLessonHtmlBlock("<p>Intro</p>", "<hr><p></p>")).toBe("<p>Intro</p><hr><p></p>")
  })

  it("returns existing html when block is empty", () => {
    expect(appendLessonHtmlBlock("<p>Keep</p>", "  ")).toBe("<p>Keep</p>")
  })
})
