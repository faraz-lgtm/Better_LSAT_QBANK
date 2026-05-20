import { describe, expect, it } from "vitest"

import { plainTextFromHtml } from "./plain-text-from-html"

describe("plainTextFromHtml", () => {
  it("strips tags and normalizes whitespace", () => {
    expect(plainTextFromHtml("<p>Hello <b>world</b></p>")).toBe("Hello world")
  })

  it("returns empty for blank input", () => {
    expect(plainTextFromHtml("")).toBe("")
    expect(plainTextFromHtml(null)).toBe("")
  })
})
