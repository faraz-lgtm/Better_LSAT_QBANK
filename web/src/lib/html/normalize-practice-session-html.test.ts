import { describe, expect, it } from "vitest"

import { normalizePracticeSessionHtml } from "./normalize-practice-session-html"

describe("normalizePracticeSessionHtml", () => {
  it("unwraps blockquotes so speaker labels align with the argument body", () => {
    const out = normalizePracticeSessionHtml(
      "<p>Medical researcher:</p><blockquote><p>Of ten major hospitals.</p></blockquote>",
    )
    expect(out).not.toContain("<blockquote")
    expect(out).toContain("Medical researcher:")
    expect(out).toContain("Of ten major hospitals.")
  })

  it("strips inline left indent styles from imported HTML", () => {
    const out = normalizePracticeSessionHtml(
      '<p>Medical researcher:</p><p style="margin-left: 40px">Indented body text.</p>',
    )
    expect(out).not.toContain("margin-left")
    expect(out).toContain("Indented body text.")
  })
})
