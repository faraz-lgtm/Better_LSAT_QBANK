import { describe, expect, it } from "vitest"

import type { DrillQuestion } from "@/features/student/drills/drill-types"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import type { PracticeQuestionResultMeta } from "@/features/student/practice-session/build-practice-results-section-groups"
import {
  filterPracticeResultPassages,
  filterPracticeResultQuestions,
  practiceResultQuestionBookmarkId,
} from "@/features/student/practice-session/filter-practice-result-questions"

function question(id: string): DrillQuestion {
  return {
    id,
    questionNumber: 1,
    stimulusText: null,
    stemText: null,
    choices: [],
    passage: null,
    correctChoiceId: null,
  }
}

function meta(
  id: string,
  extras: Partial<PracticeQuestionResultMeta> & { detailQuestionId?: string } = {},
): PracticeQuestionResultMeta {
  const { detailQuestionId, ...rest } = extras
  return {
    question: question(id),
    number: 1,
    detail: {
      questionId: detailQuestionId ?? id,
      prepTestId: "pt",
      prepTestTitle: "PT 129",
      prepTestNumber: "129",
      sectionId: "s1",
      sectionType: "LR",
      sectionNumber: 1,
      questionNumber: 1,
      topicName: "LR",
      explanationHtml: null,
      videoUrl: null,
      stimulusText: null,
      stemText: null,
      choices: [],
      correctChoiceId: null,
      passage: { id: "p1", displayNumber: 1, title: "Passage 1", body: "" },
      answerPopularity: [],
      difficulty: 3,
    } satisfies ExplanationDetailPayload,
    isCorrect: true,
    isUnanswered: false,
    selectedAnswer: "a",
    yourTimeSeconds: 6,
    ...rest,
  }
}

describe("practiceResultQuestionBookmarkId", () => {
  it("prefers the explanation question id", () => {
    expect(practiceResultQuestionBookmarkId(meta("session-q", { detailQuestionId: "expl-q" }))).toBe(
      "expl-q",
    )
  })
})

describe("filterPracticeResultQuestions", () => {
  const questions = [
    meta("q1", { isCorrect: true }),
    meta("q2", { isCorrect: false }),
    meta("q3", { isCorrect: false, isUnanswered: true }),
  ]

  it("keeps only bookmarked questions when that filter is on", () => {
    expect(
      filterPracticeResultQuestions(questions, {
        incorrectOnly: false,
        bookmarkedOnly: true,
        bookmarkedIds: new Set(["q2"]),
      }).map((row) => row.question.id),
    ).toEqual(["q2"])
  })

  it("combines incorrect-only with bookmarked-only", () => {
    expect(
      filterPracticeResultQuestions(questions, {
        incorrectOnly: true,
        bookmarkedOnly: true,
        bookmarkedIds: new Set(["q1", "q3"]),
      }).map((row) => row.question.id),
    ).toEqual(["q3"])
  })
})

describe("filterPracticeResultPassages", () => {
  it("drops passages that have no remaining questions", () => {
    const passages = [
      {
        passage: {
          id: "p1",
          passageLabel: "P1",
          title: "One",
          tags: [],
          difficulty: "Medium" as const,
          targetTime: "01:30",
          yourTime: "00:06",
          yourTimeNote: "",
        },
        questions: [meta("q1")],
      },
      {
        passage: {
          id: "p2",
          passageLabel: "P2",
          title: "Two",
          tags: [],
          difficulty: "Medium" as const,
          targetTime: "01:30",
          yourTime: "00:06",
          yourTimeNote: "",
        },
        questions: [meta("q2")],
      },
    ]

    expect(
      filterPracticeResultPassages(passages, {
        incorrectOnly: false,
        bookmarkedOnly: true,
        bookmarkedIds: new Set(["q2"]),
      }).map((group) => group.passage.id),
    ).toEqual(["p2"])
  })
})
