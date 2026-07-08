import { describe, expect, it } from "vitest"

import { matchesReviewFilters } from "@/features/student/practice-session/practice-session-review-panel"

describe("matchesReviewFilters", () => {
  const base = {
    questionNumber: 5,
    questionId: "q-5",
    currentIndex: 8,
    answered: false,
    flagged: false,
    filters: { flagged: false, unattempted: false, partiallyAttempted: false },
  }

  it("shows all questions when no filters are active", () => {
    expect(matchesReviewFilters(base)).toBe(true)
  })

  it("matches flagged questions", () => {
    expect(
      matchesReviewFilters({
        ...base,
        flagged: true,
        filters: { flagged: true, unattempted: false, partiallyAttempted: false },
      }),
    ).toBe(true)
  })

  it("matches unattempted questions", () => {
    expect(
      matchesReviewFilters({
        ...base,
        filters: { flagged: false, unattempted: true, partiallyAttempted: false },
      }),
    ).toBe(true)
  })

  it("matches partially attempted questions before the current index", () => {
    expect(
      matchesReviewFilters({
        ...base,
        filters: { flagged: false, unattempted: false, partiallyAttempted: true },
      }),
    ).toBe(true)
  })
})
