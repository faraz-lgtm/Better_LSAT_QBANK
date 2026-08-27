import { describe, expect, it } from "vitest"

import {
  ANSWER_POPULARITY_FILL_MAX,
  answerPopularityBarFillHeight,
} from "@/features/student/explanation-detail/answer-popularity-bar-height"

describe("answerPopularityBarFillHeight", () => {
  it("matches Figma sample heights at 200px track", () => {
    expect(answerPopularityBarFillHeight(0)).toBe(0)
    expect(answerPopularityBarFillHeight(2)).toBe(8)
    expect(answerPopularityBarFillHeight(11)).toBe(30.25)
    expect(answerPopularityBarFillHeight(14)).toBe(38.5)
    expect(answerPopularityBarFillHeight(72)).toBe(ANSWER_POPULARITY_FILL_MAX)
  })

  it("scales proportionally for compact tracks", () => {
    expect(answerPopularityBarFillHeight(72, 100)).toBe(98)
  })
})
