import { describe, expect, it } from "vitest"

import {
  formatPrepTestResultsTitle,
  formatQuestionRefLabel,
  filterPrepTestResultQuestions,
  mapPrepTestDetailToResults,
  prepTestBlindReviewWasCompleted,
} from "@/features/student/analytics/map-prep-test-results"
import type { PrepTestQuestionResultRow } from "@/features/student/lib/prep-test-results-types"
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
      isExperimental: false,
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
      isExperimental: false,
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
      isExperimental: false,
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
      isExperimental: false,
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
            isExperimental: false,
          },
        ],
      }),
    ).toBe(true)
  })

  it("labels experimental sections with (EXP) and keeps them out of scored totals", () => {
    const out = mapPrepTestDetailToResults({
      ...baseApi,
      totalQuestions: 4,
      correct: 3,
      incorrect: 1,
      questions: [
        ...baseApi.questions.slice(0, 2),
        {
          id: "q-exp-1",
          number: 1,
          title: "EXP Q1",
          tags: ["Flaw"],
          difficulty: "Medium",
          difficultyDots: 3,
          actualCorrect: true,
          blindReviewCorrect: true,
          blindReviewUnanswered: false,
          isUnanswered: false,
          correctLetter: "A",
          selectedLetter: "A",
          sectionType: "LR",
          sectionNumber: 3,
          isExperimental: true,
        },
      ],
    })
    expect(out.correctSummary).toBe("1/2 CORRECT (-1)")
    expect(out.totalQuestions).toBe(2)
    expect(out.listedQuestionCount).toBe(3)
    expect(out.sections.some((s) => s.sectionLabel === "Section 3 (EXP)")).toBe(true)
    expect(out.lrSections.some((s) => s.sectionTitle === "Section 3 (EXP)")).toBe(true)
  })

  it("infers Section 4 (EXP) when API omits isExperimental on a 1 RC + 3 LR test", () => {
    const out = mapPrepTestDetailToResults({
      ...baseApi,
      totalQuestions: 4,
      correct: 4,
      incorrect: 0,
      questions: [
        {
          id: "rc1",
          number: 1,
          title: "RC",
          tags: [],
          difficulty: "Easy",
          difficultyDots: 2,
          actualCorrect: true,
          blindReviewCorrect: true,
          blindReviewUnanswered: false,
          isUnanswered: false,
          correctLetter: "A",
          selectedLetter: "A",
          sectionType: "RC",
          sectionNumber: 1,
        },
        {
          id: "lr2",
          number: 1,
          title: "LR2",
          tags: [],
          difficulty: "Easy",
          difficultyDots: 2,
          actualCorrect: true,
          blindReviewCorrect: true,
          blindReviewUnanswered: false,
          isUnanswered: false,
          correctLetter: "A",
          selectedLetter: "A",
          sectionType: "LR",
          sectionNumber: 2,
        },
        {
          id: "lr3",
          number: 1,
          title: "LR3",
          tags: [],
          difficulty: "Easy",
          difficultyDots: 2,
          actualCorrect: false,
          blindReviewCorrect: false,
          blindReviewUnanswered: false,
          isUnanswered: false,
          correctLetter: "A",
          selectedLetter: "B",
          sectionType: "LR",
          sectionNumber: 3,
        },
        {
          id: "lr4",
          number: 1,
          title: "LR4",
          tags: [],
          difficulty: "Easy",
          difficultyDots: 2,
          actualCorrect: true,
          blindReviewCorrect: true,
          blindReviewUnanswered: false,
          isUnanswered: false,
          correctLetter: "A",
          selectedLetter: "A",
          sectionType: "LR",
          sectionNumber: 4,
        },
      ],
    })
    expect(out.sections.map((s) => s.sectionLabel)).toEqual([
      "Section 1",
      "Section 2",
      "Section 3",
      "Section 4 (EXP)",
    ])
    expect(out.sectionBlocks.map((s) => ({ title: s.sectionTitle, exp: s.isExperimental }))).toEqual([
      { title: "Section 1", exp: false },
      { title: "Section 2", exp: false },
      { title: "Section 3", exp: false },
      { title: "Section 4 (EXP)", exp: true },
    ])
    expect(out.correctSummary).toBe("2/3 CORRECT (-1)")
    expect(out.totalQuestions).toBe(3)
    expect(out.listedQuestionCount).toBe(4)
  })
})

describe("filterPrepTestResultQuestions", () => {
  const rows = [
    { id: "q1", actualCorrect: true, isUnanswered: false },
    { id: "q2", actualCorrect: false, isUnanswered: false },
    { id: "q3", actualCorrect: false, isUnanswered: true },
  ] as Array<Pick<PrepTestQuestionResultRow, "id" | "actualCorrect" | "isUnanswered">>

  it("keeps only bookmarked questions when that filter is on", () => {
    expect(
      filterPrepTestResultQuestions(rows as PrepTestQuestionResultRow[], {
        incorrectOnly: false,
        bookmarkedOnly: true,
        bookmarkedIds: new Set(["q2"]),
      }).map((row) => row.id),
    ).toEqual(["q2"])
  })
})
