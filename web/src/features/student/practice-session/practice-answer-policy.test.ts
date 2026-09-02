import { describe, expect, it } from "vitest"

import {
  canChangePracticeAnswer,
  isEditingBlindReviewAnswers,
  resolveDisplayedPracticeAnswer,
} from "./practice-session-types"

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

describe("isEditingBlindReviewAnswers", () => {
  it("does not treat a live test as Blind Review editing", () => {
    expect(
      isEditingBlindReviewAnswers({
        resultsReview: false,
        answeringBlindReview: false,
        answerView: "blind_review",
      }),
    ).toBe(false)
  })

  it("allows selecting only on the Blind Review tab", () => {
    expect(
      isEditingBlindReviewAnswers({
        resultsReview: false,
        answeringBlindReview: true,
        answerView: "blind_review",
      }),
    ).toBe(true)
    expect(
      isEditingBlindReviewAnswers({
        resultsReview: false,
        answeringBlindReview: true,
        answerView: "actual",
      }),
    ).toBe(false)
  })

  it("locks choices during results review even on the Blind Review tab", () => {
    expect(
      isEditingBlindReviewAnswers({
        resultsReview: true,
        answeringBlindReview: false,
        answerView: "blind_review",
      }),
    ).toBe(false)
  })
})

describe("resolveDisplayedPracticeAnswer", () => {
  const actual = { selectedAnswer: "a" }
  const blindReview = { selectedAnswer: "b" }
  const live = { selectedAnswer: "c" }

  it("shows live answers during the test", () => {
    expect(
      resolveDisplayedPracticeAnswer({
        resultsReview: false,
        answeringBlindReview: false,
        answerView: "blind_review",
        actual,
        blindReview,
        live,
      }),
    ).toEqual(live)
  })

  it("does not show the Actual selection while editing Blind Review", () => {
    expect(
      resolveDisplayedPracticeAnswer({
        resultsReview: false,
        answeringBlindReview: true,
        answerView: "blind_review",
        actual,
        blindReview,
        live,
      }),
    ).toEqual(blindReview)
  })

  it("shows Actual answers when the Actual tab is open during Blind Review", () => {
    expect(
      resolveDisplayedPracticeAnswer({
        resultsReview: false,
        answeringBlindReview: true,
        answerView: "actual",
        actual,
        blindReview,
        live,
      }),
    ).toEqual(actual)
  })
})
