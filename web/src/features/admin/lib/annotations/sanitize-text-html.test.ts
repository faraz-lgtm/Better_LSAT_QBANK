import { describe, expect, it } from "vitest"

import { sanitizeAnnotationTextHtml } from "./sanitize-text-html"

describe("sanitizeAnnotationTextHtml", () => {
  it("keeps b i u br", () => {
    const out = sanitizeAnnotationTextHtml("<b>bold</b> <i>it</i> <u>u</u><br/>x")
    expect(out).toContain("<b>")
    expect(out).toContain("<i>")
    expect(out).toContain("<u>")
    expect(out).toContain("<br")
  })

  it("strips script", () => {
    const out = sanitizeAnnotationTextHtml('<script>alert(1)</script><b>x</b>')
    expect(out).not.toContain("script")
    expect(out).toContain("x")
  })

  it("strips onclick", () => {
    const out = sanitizeAnnotationTextHtml('<span onclick="evil()">x</span>')
    expect(out).not.toContain("onclick")
  })

  it("allows limited span style", () => {
    const out = sanitizeAnnotationTextHtml('<span style="color: red; font-weight: bold">z</span>')
    expect(out).toContain("color")
    expect(out).toContain("font-weight")
  })

  it("removes javascript url in style", () => {
    const out = sanitizeAnnotationTextHtml('<span style="color: url(javascript:void(0))">x</span>')
    expect(out).not.toContain("javascript")
  })
})
