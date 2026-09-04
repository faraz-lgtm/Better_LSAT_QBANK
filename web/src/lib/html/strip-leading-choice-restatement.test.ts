import { describe, expect, it } from "vitest"

import { stripLeadingChoiceRestatement } from "./strip-leading-choice-restatement"

describe("stripLeadingChoiceRestatement", () => {
  const choice =
    "<p>Some of the great creative geniuses in history were first-born children.</p>"

  it("removes a leading blockquote restatement of the choice (CMS format)", () => {
    const explanation =
      "<blockquote>A) Some of the great creative geniuses in history were first-born children.</blockquote> " +
      "<p>This answer choice is problematic for two main reasons.</p>"

    expect(stripLeadingChoiceRestatement(explanation, choice)).toBe(
      "<p>This answer choice is problematic for two main reasons.</p>",
    )
  })

  it("removes a leading struck-through restatement of the choice", () => {
    const explanation =
      "<p><s>A) Some of the great creative geniuses in history were first-born children.</s></p>" +
      "<p>This choice is problematic because birth order is not established.</p>"

    expect(stripLeadingChoiceRestatement(explanation, choice)).toBe(
      "<p>This choice is problematic because birth order is not established.</p>",
    )
  })

  it("removes a plain restatement that matches the choice text", () => {
    const shortChoice = "<p>Choice text here.</p>"
    const explanation = "<p>A) Choice text here.</p><p>Why it fails.</p>"

    expect(stripLeadingChoiceRestatement(explanation, shortChoice)).toBe("<p>Why it fails.</p>")
  })

  it("leaves explanations that do not restate the choice untouched", () => {
    const explanation = "<p>Because A is wrong for unrelated reasons.</p>"

    expect(stripLeadingChoiceRestatement(explanation, "<p>Choice A</p>")).toBe(explanation)
  })

  it("returns empty string for nullish explanation", () => {
    expect(stripLeadingChoiceRestatement(null, "<p>A</p>")).toBe("")
    expect(stripLeadingChoiceRestatement("  ", "<p>A</p>")).toBe("")
  })
})
