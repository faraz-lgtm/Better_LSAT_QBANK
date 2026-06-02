import { describe, expect, it } from "vitest"

import { highlightFindInHtml, stripFindMarksFromHtml } from "./highlight-find-in-html"

describe("highlightFindInHtml", () => {
  it("returns sanitized html when query is empty", () => {
    expect(highlightFindInHtml("<p>Hello world</p>", "")).toBe("<p>Hello world</p>")
  })

  it("wraps case-insensitive matches in mark tags", () => {
    const out = highlightFindInHtml("<p>Hello World</p>", "world")
    expect(out).toContain('mark class="practice-find-mark"')
    expect(out).toContain("World")
  })

  it("finds text across inline tags", () => {
    const out = highlightFindInHtml("<p>The <b>critics</b> said</p>", "critics")
    expect(out).toContain('mark class="practice-find-mark"')
    expect(out).toContain("critics")
  })

  it("returns unchanged html when no match", () => {
    expect(highlightFindInHtml("<p>Alpha</p>", "beta")).toBe("<p>Alpha</p>")
  })

  it("strips find marks for persistence snapshots", () => {
    const marked = highlightFindInHtml("<p>Find me</p>", "find")
    const stripped = stripFindMarksFromHtml(marked)
    expect(stripped).not.toContain("practice-find-mark")
    expect(stripped).toContain("Find me")
  })
})
