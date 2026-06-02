import { describe, expect, it } from "vitest"

import { canChangePracticeAnswer } from "./practice-session-types"

describe("canChangePracticeAnswer", () => {
  it('locks after answer when showAnswers is "each"', () => {
    expect(canChangePracticeAnswer("each", true)).toBe(false)
    expect(canChangePracticeAnswer("each", false)).toBe(true)
  })

  it('allows change when showAnswers is "end" or "never"', () => {
    expect(canChangePracticeAnswer("end", true)).toBe(true)
    expect(canChangePracticeAnswer("never", true)).toBe(true)
  })

  it("always allows change in blind review", () => {
    expect(canChangePracticeAnswer("each", true, { blindReview: true })).toBe(true)
  })
})
