import { describe, expect, it } from "vitest"

import { choiceIndexFromAnswer, hasPracticeAnswer } from "./practice-choice-index"

const choices = [
  { id: "A", index: 1 },
  { id: "B", index: 2 },
  { id: "C", index: 3 },
]

describe("hasPracticeAnswer", () => {
  it("is false for missing or blank answers", () => {
    expect(hasPracticeAnswer(undefined)).toBe(false)
    expect(hasPracticeAnswer({ selectedAnswer: "" })).toBe(false)
    expect(hasPracticeAnswer({ selectedAnswer: "  " })).toBe(false)
  })

  it("is true when a letter is stored", () => {
    expect(hasPracticeAnswer({ selectedAnswer: "B" })).toBe(true)
  })
})

describe("choiceIndexFromAnswer", () => {
  it("maps selected answer letters to choice indices", () => {
    expect(choiceIndexFromAnswer(choices, "B")).toBe(1)
    expect(choiceIndexFromAnswer(choices, "b")).toBe(1)
    expect(choiceIndexFromAnswer(choices, "C")).toBe(2)
    expect(choiceIndexFromAnswer(choices, "Z")).toBeNull()
  })

  it("maps 1-based numeric answers and wrapped letters", () => {
    expect(choiceIndexFromAnswer(choices, "2")).toBe(1)
    expect(choiceIndexFromAnswer(choices, "(A)")).toBe(0)
    expect(choiceIndexFromAnswer(choices, "A.")).toBe(0)
  })
})
