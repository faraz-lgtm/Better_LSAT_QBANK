import { describe, expect, it } from "vitest"

import type { DrillQuestion } from "@/features/student/drills/drill-types"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { buildPracticeResultsSectionGroups } from "@/features/student/practice-session/build-practice-results-section-groups"

function question(id: string, extras: Partial<DrillQuestion> = {}): DrillQuestion {
  return {
    id,
    questionNumber: null,
    stimulusText: null,
    stemText: null,
    choices: [],
    passage: extras.passage ?? { id: "collapsed", displayNumber: 1, title: "Passage 1", body: "" },
    sourceGroupId: extras.sourceGroupId ?? null,
    correctChoiceId: null,
    targetTimeSeconds: extras.targetTimeSeconds,
  }
}

function detail(id: string): ExplanationDetailPayload {
  return {
    questionId: id,
    prepTestId: "pt",
    prepTestTitle: "PT 128",
    prepTestNumber: "128",
    sectionId: "s4",
    sectionType: "RC",
    sectionNumber: 4,
    questionNumber: 1,
    topicName: "RC",
    explanationHtml: null,
    videoUrl: null,
    stimulusText: null,
    stemText: null,
    choices: [],
    correctChoiceId: null,
    passage: { id: "collapsed", displayNumber: 1, title: "Passage 1", body: "" },
    answerPopularity: [],
    difficulty: 3,
  }
}

describe("buildPracticeResultsSectionGroups RC passages", () => {
  it("splits RC questions by sourceGroupId when passage ids are collapsed", () => {
    const questions = [
      question("q1", { sourceGroupId: "g1" }),
      question("q2", { sourceGroupId: "g1" }),
      question("q3", { sourceGroupId: "g2" }),
      question("q4", { sourceGroupId: "g2" }),
      question("q5", { sourceGroupId: "g3" }),
    ]
    const detailsByQuestion = Object.fromEntries(questions.map((q) => [q.id, detail(q.id)]))

    const groups = buildPracticeResultsSectionGroups({
      questions,
      answersByQuestion: new Map(),
      blindReviewAnswersByQuestion: null,
      detailsByQuestion,
      defaultKind: "RC",
      fallbackSectionNumber: 4,
      perQuestionSeconds: 30,
    })

    expect(groups).toHaveLength(1)
    expect(groups[0]?.passages.map((p) => p.passage.passageLabel)).toEqual(["P1", "P2", "P3"])
    expect(groups[0]?.passages.map((p) => p.passage.title)).toEqual([
      "Passage 1",
      "Passage 2",
      "Passage 3",
    ])
    expect(groups[0]?.passages[0]?.questions.map((q) => q.question.id)).toEqual(["q1", "q2"])
    expect(groups[0]?.passages[1]?.questions.map((q) => q.question.id)).toEqual(["q3", "q4"])
    expect(groups[0]?.passages[2]?.questions.map((q) => q.question.id)).toEqual(["q5"])
    expect(groups[0]?.passages[1]?.questions[0]?.number).toBe(3)
  })

  it("sums API targetTimeSeconds for passage target time", () => {
    const questions = [
      question("q1", { sourceGroupId: "g1", targetTimeSeconds: 70 }),
      question("q2", { sourceGroupId: "g1", targetTimeSeconds: 80 }),
    ]
    const detailsByQuestion = Object.fromEntries(questions.map((q) => [q.id, detail(q.id)]))

    const groups = buildPracticeResultsSectionGroups({
      questions,
      answersByQuestion: new Map(),
      blindReviewAnswersByQuestion: null,
      detailsByQuestion,
      defaultKind: "RC",
      fallbackSectionNumber: 4,
      perQuestionSeconds: 30,
    })

    expect(groups[0]?.passages[0]?.passage.targetTime).toBe("2:30")
  })

  it("uses per-question times for SECTION results and leaves unanswered as null", () => {
    const questions = [
      question("q1", { sourceGroupId: "g1", targetTimeSeconds: 70 }),
      question("q2", { sourceGroupId: "g1", targetTimeSeconds: 80 }),
    ]
    const detailsByQuestion = Object.fromEntries(questions.map((q) => [q.id, detail(q.id)]))
    const groups = buildPracticeResultsSectionGroups({
      questions,
      answersByQuestion: new Map([["q1", { selectedAnswer: "A", isCorrect: true }]]),
      blindReviewAnswersByQuestion: null,
      detailsByQuestion,
      defaultKind: "RC",
      fallbackSectionNumber: 4,
      perQuestionSeconds: 30,
      yourTimeByQuestion: new Map([
        ["q1", 40],
        ["q2", 12],
      ]),
    })

    expect(groups[0]?.passages[0]?.questions[0]?.yourTimeSeconds).toBe(40)
    expect(groups[0]?.passages[0]?.questions[1]?.yourTimeSeconds).toBeNull()
    expect(groups[0]?.passages[0]?.passage.yourTime).toBe("0:40")
  })
})
