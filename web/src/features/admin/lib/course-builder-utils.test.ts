import { describe, expect, it } from "vitest"

import { appendLessonHtmlBlock, preserveEmptyParagraphBreaks } from "@/features/admin/lib/course-builder-utils"

describe("preserveEmptyParagraphBreaks", () => {
  it("adds a br inside empty paragraphs so blank lines keep height", () => {
    expect(preserveEmptyParagraphBreaks("<p>One</p><p></p><p></p><p>Two</p>")).toBe(
      "<p>One</p><p><br></p><p><br></p><p>Two</p>",
    )
  })

  it("preserves paragraph attributes on empty spacers", () => {
    expect(preserveEmptyParagraphBreaks('<p style="text-align: center"></p>')).toBe(
      '<p style="text-align: center"><br></p>',
    )
  })

  it("leaves paragraphs that already have a break alone", () => {
    expect(preserveEmptyParagraphBreaks("<p><br></p><p>Keep</p>")).toBe("<p><br></p><p>Keep</p>")
  })
})

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
