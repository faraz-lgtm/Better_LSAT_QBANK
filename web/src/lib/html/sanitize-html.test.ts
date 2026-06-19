import { describe, expect, it } from "vitest"

import { sanitizeHtml } from "./sanitize-html"

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
})
