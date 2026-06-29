import { describe, expect, it } from "vitest"

import {
  formatPrepTestResultsTitle,
  formatQuestionRefLabel,
  mapPrepTestDetailToResults,
  prepTestBlindReviewWasCompleted,
} from "@/features/student/analytics/map-prep-test-results"
import type { PrepTestSessionDetail } from "@/lib/api/analytics"

const baseApi: PrepTestSessionDetail = {
  sessionId: "sess-1",
  prepTestId: "pt-145",
  prepTestTitle: "PrepTest 145",
  moduleId: "LSAC145",
  completedAt: "2025-10-03T12:00:00.000Z",
  startedAt: "2025-10-03T10:00:00.000Z",
  excluded: false,
  totalQuestions: 4,
  scaledScore: 167,
  blindReviewScore: 170,
  correct: 3,
  incorrect: 1,
  percentile: 90.6,
  blindReviewPercentile: 92,
  blindReviewCompletedAt: "2025-10-04T12:00:00.000Z",
  questions: [
    {
      id: "q1",
      number: 1,
      title: "Q1",
      tags: ["Art"],
      difficulty: "Hard",
      difficultyDots: 4,
      actualCorrect: true,
      blindReviewCorrect: true,
      blindReviewUnanswered: false,
      isUnanswered: false,
      correctLetter: "A",
      selectedLetter: "A",
      sectionType: "LR",
      sectionNumber: 1,
    },
    {
      id: "q2",
      number: 2,
      title: "Q2",
      tags: ["Art"],
      difficulty: "Medium",
      difficultyDots: 3,
      actualCorrect: false,
      blindReviewCorrect: true,
      blindReviewUnanswered: false,
      isUnanswered: false,
      correctLetter: "B",
      selectedLetter: "A",
      sectionType: "LR",
      sectionNumber: 1,
    },
    {
      id: "q3",
      number: 1,
      title: "Q3",
      tags: ["RC"],
      difficulty: "Easy",
      difficultyDots: 2,
      actualCorrect: true,
      blindReviewCorrect: false,
      blindReviewUnanswered: false,
      isUnanswered: false,
      correctLetter: "C",
      selectedLetter: "C",
      sectionType: "RC",
      sectionNumber: 2,
    },
    {
      id: "q4",
      number: 2,
      title: "Q4",
      tags: ["RC"],
      difficulty: "Easy",
      difficultyDots: 2,
      actualCorrect: true,
      blindReviewCorrect: true,
      blindReviewUnanswered: false,
      isUnanswered: false,
      correctLetter: "D",
      selectedLetter: "D",
      sectionType: "RC",
      sectionNumber: 2,
    },
  ],
}

describe("mapPrepTestDetailToResults", () => {
  it("builds section summaries and LR/RC blocks from API questions", () => {
    const out = mapPrepTestDetailToResults(baseApi)
    expect(out.sections).toHaveLength(2)
    expect(out.sections[0]?.sectionLabel).toBe("Section 1")
    expect(out.sections[0]?.accuracyPct).toBe(50)
    expect(out.lrSections).toHaveLength(1)
    expect(out.lrSections[0]?.scoreDisplay).toBe("-1")
    expect(out.lrSections[0]?.blindReviewDisplay).toBe("0")
    expect(out.lrSections[0]?.questions).toHaveLength(2)
    expect(out.lrSections[0]?.questions[0]?.title).toBe("PT 145  .  S1  .  Q1")
    expect(out.rcSection.questions).toHaveLength(2)
    expect(out.rcSection.questions[0]?.title).toBe("PT 145  .  S2  .  Q1")
    expect(out.correctSummary).toBe("3/4 CORRECT (-1)")
    expect(out.scaledScore).toBe(170)
    expect(out.prediction).toBe(167)
    expect(out.blindReview).toBe(170)
    expect(out.blindReviewCompleted).toBe(true)
  })

  it("formats question ref labels like Figma PT 129  .  S1  .  Q19", () => {
    expect(formatQuestionRefLabel("LSAC129", "PrepTest 129", 1, 19)).toBe("PT 129  .  S1  .  Q19")
  })

  it("formats page title like Figma PT145 - October 3, 2025", () => {
    expect(formatPrepTestResultsTitle("PrepTest 145", "LSAC145", "2025-10-03T12:00:00.000Z")).toBe(
      "PT145 - October 3, 2025",
    )
  })

  it("detects blind review from answer changes when completion timestamp is missing", () => {
    expect(
      prepTestBlindReviewWasCompleted({
        blindReviewCompletedAt: null,
        questions: [
          {
            id: "q1",
            number: 1,
            title: "Q1",
            tags: [],
            difficulty: "Easy",
            difficultyDots: 2,
      actualCorrect: false,
      blindReviewCorrect: true,
      blindReviewUnanswered: false,
      isUnanswered: false,
            correctLetter: "A",
            selectedLetter: "B",
            sectionType: "LR",
            sectionNumber: 1,
          },
        ],
      }),
    ).toBe(true)
  })
})
