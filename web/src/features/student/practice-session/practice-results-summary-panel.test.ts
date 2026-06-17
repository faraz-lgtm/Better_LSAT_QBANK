import { describe, expect, it } from "vitest"

import { buildPracticeSectionSummaries } from "@/features/student/practice-session/practice-results-summary-panel"

describe("buildPracticeSectionSummaries", () => {
  it("groups questions by section and computes score delta", () => {
    const answersByQuestion = new Map([
      ["q1", { selectedAnswer: "A", isCorrect: true }],
      ["q2", { selectedAnswer: "B", isCorrect: false }],
      ["q3", { selectedAnswer: "C", isCorrect: false }],
    ])

    const sections = buildPracticeSectionSummaries({
      questionIds: ["q1", "q2", "q3"],
      answersByQuestion,
      detailsByQuestion: {
        q1: {
          questionId: "q1",
          prepTestId: "pt1",
          prepTestTitle: "PT 1",
          prepTestNumber: "1",
          sectionId: "s1",
          sectionType: "LR",
          sectionNumber: 2,
          questionNumber: 10,
          topicName: "Args",
          explanationHtml: null,
          videoUrl: null,
          stimulusText: null,
          stemText: null,
          choices: [],
          correctChoiceId: null,
          passage: { id: "p1", displayNumber: 1, title: "", body: "" },
          answerPopularity: [],
          difficulty: 3,
        },
        q2: {
          questionId: "q2",
          prepTestId: "pt1",
          prepTestTitle: "PT 1",
          prepTestNumber: "1",
          sectionId: "s1",
          sectionType: "LR",
          sectionNumber: 2,
          questionNumber: 11,
          topicName: "Args",
          explanationHtml: null,
          videoUrl: null,
          stimulusText: null,
          stemText: null,
          choices: [],
          correctChoiceId: null,
          passage: { id: "p1", displayNumber: 1, title: "", body: "" },
          answerPopularity: [],
          difficulty: 3,
        },
        q3: {
          questionId: "q3",
          prepTestId: "pt1",
          prepTestTitle: "PT 1",
          prepTestNumber: "1",
          sectionId: "s1",
          sectionType: "LR",
          sectionNumber: 2,
          questionNumber: 12,
          topicName: "Args",
          explanationHtml: null,
          videoUrl: null,
          stimulusText: null,
          stemText: null,
          choices: [],
          correctChoiceId: null,
          passage: { id: "p1", displayNumber: 1, title: "", body: "" },
          answerPopularity: [],
          difficulty: 3,
        },
      },
      defaultKind: "LR",
      fallbackSectionNumber: null,
    })

    expect(sections).toHaveLength(1)
    expect(sections[0]?.sectionLabel).toBe("Section 2")
    expect(sections[0]?.scoreDelta).toBe(-2)
    expect(sections[0]?.accuracyPct).toBe(33)
    expect(sections[0]?.questionRows).toEqual([["correct", "incorrect", "incorrect"]])
  })
})
