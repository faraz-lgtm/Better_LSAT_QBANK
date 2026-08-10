import { describe, expect, it } from "vitest"

import {
  scorePrepTestQuestions,
  withExperimentalSectionFlags,
} from "@/features/student/analytics/prep-test-experimental-sections"
import type { PrepTestSessionDetail } from "@/lib/api/analytics"

function q(
  partial: Partial<PrepTestSessionDetail["questions"][number]> &
    Pick<PrepTestSessionDetail["questions"][number], "id" | "sectionType" | "sectionNumber">,
): PrepTestSessionDetail["questions"][number] {
  return {
    number: 1,
    title: partial.id,
    tags: [],
    difficulty: "Medium",
    difficultyDots: 3,
    actualCorrect: true,
    blindReviewCorrect: true,
    blindReviewUnanswered: false,
    isUnanswered: false,
    correctLetter: "A",
    selectedLetter: "A",
    ...partial,
  }
}

describe("withExperimentalSectionFlags", () => {
  it("trusts API flags when any question is experimental", () => {
    const out = withExperimentalSectionFlags([
      q({ id: "a", sectionType: "LR", sectionNumber: 1, isExperimental: false }),
      q({ id: "b", sectionType: "LR", sectionNumber: 4, isExperimental: true }),
    ])
    expect(out.map((row) => row.isExperimental)).toEqual([false, true])
  })

  it("marks the third LR as experimental when API omits flags (PT-style 1 RC + 3 LR)", () => {
    const out = withExperimentalSectionFlags([
      q({ id: "rc1", sectionType: "RC", sectionNumber: 1 }),
      q({ id: "lr2", sectionType: "LR", sectionNumber: 2 }),
      q({ id: "lr3", sectionType: "LR", sectionNumber: 3 }),
      q({ id: "lr4", sectionType: "LR", sectionNumber: 4 }),
    ])
    expect(out.find((row) => row.id === "rc1")?.isExperimental).toBe(false)
    expect(out.find((row) => row.id === "lr2")?.isExperimental).toBe(false)
    expect(out.find((row) => row.id === "lr3")?.isExperimental).toBe(false)
    expect(out.find((row) => row.id === "lr4")?.isExperimental).toBe(true)
  })

  it("marks a second RC as experimental", () => {
    const out = withExperimentalSectionFlags([
      q({ id: "rc1", sectionType: "RC", sectionNumber: 1 }),
      q({ id: "rc2", sectionType: "RC", sectionNumber: 4 }),
      q({ id: "lr2", sectionType: "LR", sectionNumber: 2 }),
      q({ id: "lr3", sectionType: "LR", sectionNumber: 3 }),
    ])
    expect(out.find((row) => row.id === "rc2")?.isExperimental).toBe(true)
  })
})

describe("scorePrepTestQuestions", () => {
  it("excludes experimental questions from correct/total", () => {
    const scored = scorePrepTestQuestions(
      withExperimentalSectionFlags([
        q({ id: "scored", sectionType: "LR", sectionNumber: 1, actualCorrect: true }),
        q({ id: "exp", sectionType: "LR", sectionNumber: 4, actualCorrect: true }),
        q({ id: "miss", sectionType: "LR", sectionNumber: 2, actualCorrect: false }),
      ]),
    )
    expect(scored).toEqual({ correct: 1, incorrect: 1, totalQuestions: 2 })
  })
})
