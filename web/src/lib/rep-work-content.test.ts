import { describe, expect, it } from "vitest"

import {
  htmlToPlainText,
  isRepWorkJson,
  parseRepWorkFromTextContent,
  serializeRepWorkContent,
  stripInstructionsLabel,
  trimEmptyHtmlParagraphs,
} from "./rep-work-content"

describe("rep-work-content", () => {
  it("round-trips v1 payload", () => {
    const raw = serializeRepWorkContent("<p>Hi</p>", [{ question: "<p>Q</p>", answer: "<p>A</p>" }])
    expect(isRepWorkJson(raw)).toBe(true)
    const parsed = parseRepWorkFromTextContent(raw)
    expect(parsed.instructions).toContain("Hi")
    expect(parsed.pairs).toHaveLength(1)
    expect(parsed.pairs[0].question).toContain("Q")
  })

  it("treats plain HTML as non-json rep parse fallback", () => {
    expect(isRepWorkJson("<p>x</p>")).toBe(false)
  })

  it("htmlToPlainText strips tags", () => {
    expect(htmlToPlainText("<p>All surgeons enjoy blood.</p>")).toBe("All surgeons enjoy blood.")
  })

  it("stripInstructionsLabel removes leading Instructions paragraph", () => {
    expect(
      stripInstructionsLabel("<p>Instructions:</p><p>Translate all English statements.</p>"),
    ).toBe("<p>Translate all English statements.</p>")
  })

  it("trimEmptyHtmlParagraphs removes blank trailing paragraphs", () => {
    expect(trimEmptyHtmlParagraphs("<p>Hello</p><p></p><p><br></p>")).toBe("<p>Hello</p>")
    expect(trimEmptyHtmlParagraphs("<p></p><p>Hello</p>")).toBe("<p>Hello</p>")
    expect(trimEmptyHtmlParagraphs("<p>Hello</p><p></p><p>World</p>")).toBe("<p>Hello</p><p>World</p>")
  })
})
