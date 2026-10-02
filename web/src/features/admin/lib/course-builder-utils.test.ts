import { describe, expect, it } from "vitest"

import {
  appendLessonHtmlBlock,
  normalizeTipTapHtml,
  preserveEmptyParagraphBreaks,
  shouldApplyIncomingEditorHtml,
  shouldHydrateLessonForm,
} from "@/features/admin/lib/course-builder-utils"

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

describe("normalizeTipTapHtml", () => {
  it("treats empty paragraphs and editor trailing breaks as the same spacer", () => {
    expect(normalizeTipTapHtml("<p></p>")).toBe("<p><br></p>")
    expect(normalizeTipTapHtml('<p><br class="ProseMirror-trailingBreak"></p>')).toBe("<p><br></p>")
  })
})

describe("shouldApplyIncomingEditorHtml", () => {
  it("does not re-apply html the editor just emitted even if getHTML adds a trailing break", () => {
    const emitted = normalizeTipTapHtml("<p>Trap 1</p><p></p>")
    expect(
      shouldApplyIncomingEditorHtml(emitted, emitted, '<p>Trap 1</p><p><br class="ProseMirror-trailingBreak"></p>'),
    ).toBe(false)
  })

  it("skips when incoming already matches the live editor document", () => {
    expect(shouldApplyIncomingEditorHtml("<p></p>", "<p>stale</p>", "<p><br></p>")).toBe(false)
  })

  it("applies html that did not originate from this editor", () => {
    expect(shouldApplyIncomingEditorHtml("<p>Server copy</p>", "<p>Local draft</p>", "<p>Local draft</p>")).toBe(true)
  })
})

describe("shouldHydrateLessonForm", () => {
  it("hydrates when switching to a different lesson", () => {
    expect(shouldHydrateLessonForm("lesson-a", "lesson-b")).toBe(true)
  })

  it("does not hydrate when the same lesson row is replaced after a curriculum reload", () => {
    expect(shouldHydrateLessonForm("lesson-a", "lesson-a")).toBe(false)
  })

  it("does not hydrate when nothing is selected", () => {
    expect(shouldHydrateLessonForm("lesson-a", null)).toBe(false)
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
