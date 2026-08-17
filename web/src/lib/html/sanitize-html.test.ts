import { describe, expect, it } from "vitest"

import { sanitizeHtml, sanitizeLessonHtml } from "./sanitize-html"

describe("sanitizeHtml", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeHtml(null)).toBe("")
    expect(sanitizeHtml(42)).toBe("")
  })

  it("allows basic LSAT markup", () => {
    const out = sanitizeHtml("<p>Hello <strong>world</strong></p>")
    expect(out).toContain("<p>")
    expect(out).toContain("<strong>world</strong>")
  })

  it("strips script tags", () => {
    const out = sanitizeHtml('<p>Safe</p><script>alert(1)</script>')
    expect(out).not.toContain("<script")
    expect(out).toContain("Safe")
  })

  it("strips event handlers", () => {
    const out = sanitizeHtml('<span onclick="evil()">x</span>')
    expect(out).not.toContain("onclick")
    expect(out).toContain("x")
  })

  it("preserves highlight marks with data-highlight", () => {
    const out = sanitizeHtml('<p>test <mark data-highlight="yellow">hi</mark></p>')
    expect(out).toContain('data-highlight="yellow"')
    expect(out).toContain("<mark")
  })

  it("strips headings from question html", () => {
    const out = sanitizeHtml("<h1>Should not show in questions</h1><p>ok</p>")
    expect(out).not.toContain("<h1>")
    expect(out).toContain("ok")
  })
})

describe("sanitizeLessonHtml", () => {
  it("keeps lesson section markup and h1", () => {
    const html =
      '<section data-lesson-section="true" data-label="THE BIG PICTURE"><h1>LSAC and the move</h1><p>Body</p></section>'
    const out = sanitizeLessonHtml(html)
    expect(out).toContain("data-lesson-section")
    expect(out).toContain('data-label="THE BIG PICTURE"')
    expect(out).toContain("<h1>")
    expect(out).toContain("LSAC and the move")
  })

  it("keeps empty section variant and background", () => {
    const out = sanitizeLessonHtml(
      '<section data-lesson-section="true" data-variant="empty" data-bg="#f3f7ff"><p></p></section>',
    )
    expect(out).toContain('data-variant="empty"')
    expect(out).toContain('data-bg="#f3f7ff"')
  })

  it("strips script tags", () => {
    const out = sanitizeLessonHtml("<h1>Safe</h1><script>alert(1)</script>")
    expect(out).not.toContain("<script")
    expect(out).toContain("Safe")
  })
})
