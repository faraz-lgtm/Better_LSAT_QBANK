import { describe, expect, it } from "vitest"

import {
  htmlToPlainText,
  isRepWorkJson,
  parseRepWorkFromTextContent,
  serializeRepWorkContent,
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
})
