import { describe, expect, it } from "vitest"

import { buildExplanationQuestionDetailView } from "@/features/student/explanation-detail/build-explanation-detail-view"
import type { LocatedExplanationQuestion } from "@/features/student/explanation-detail/explanation-question-index"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"

const loc = {
  routeKey: "pt1:sec1:q1",
  pt: { id: "pt1", prepTestNumber: "129", rowSubtitle: "", sections: [] },
  sec: { id: "sec1", sectionNumber: 1, kind: "LR" as const, sectionTitle: "LR", flags: "", passages: [] },
  pass: { id: "pass1", label: "P1", title: "Passage 1", snippet: "", questions: [] },
  q: {
    id: "q1",
    number: 19,
    code: "Q19",
    snippet: "Stem",
    topicName: "Flaw",
    status: "answered" as const,
    source: "",
    difficulty: 5 as const,
    hasVideo: false,
    hasWrittenExplanation: true,
  },
} satisfies LocatedExplanationQuestion

describe("buildExplanationQuestionDetailView", () => {
  it("maps answer popularity from API detail", () => {
    const detail: ExplanationDetailPayload = {
      questionId: "q1",
      prepTestId: "pt1",
      prepTestTitle: "PT 129",
      prepTestNumber: "129",
      sectionId: "sec1",
      sectionType: "LR",
      sectionNumber: 1,
      questionNumber: 19,
      topicName: "Art, Sing",
      explanationHtml: null,
      videoUrl: null,
      stimulusText: null,
      stemText: "Stem",
      choices: [
        { id: "A", index: 1, text: "a", explanationHtml: null },
        { id: "B", index: 2, text: "b", explanationHtml: null },
      ],
      correctChoiceId: "A",
      passage: { id: "p1", displayNumber: 1, title: "P1", body: "" },
      answerPopularity: [
        { letter: "A", count: 3, pct: 75, highlight: true },
        { letter: "B", count: 1, pct: 25 },
      ],
      userSelectedLetter: "B",
      difficulty: 5,
    }

    const view = buildExplanationQuestionDetailView(loc, detail)
    const a = view.analytics.answerPopularity.find((r) => r.letter === "A")
    expect(a?.count).toBe(3)
    expect(a?.pct).toBe(75)
    expect(a?.highlight).toBe(true)
    expect(view.analytics.answerPopularityTotal).toBe(4)
    expect(view.analytics.userSelectedLetter).toBe("B")
    expect(view.analytics.questionStemTags).toEqual(["Art", "Sing"])
  })

  it("maps null userSelectedLetter when never answered", () => {
    const view = buildExplanationQuestionDetailView(loc, null)
    expect(view.analytics.userSelectedLetter).toBeNull()
  })

  it("keeps explanation tab hidden until content is ready", () => {
    const view = buildExplanationQuestionDetailView(loc, null)
    expect(view.hasExplanationTab).toBe(false)
    expect(view.videos).toHaveLength(2)
    expect(view.videos[0]?.dropdownLabel).toBe("Passage explanation")
    expect(view.videos[1]?.dropdownLabel).toBe("Question explanation")
    expect(view.videos[0]?.explanationHtml).toBeNull()
  })

  it("maps written explanation to passage card and shows analysis tab", () => {
    const detail: ExplanationDetailPayload = {
      questionId: "q1",
      prepTestId: "pt1",
      prepTestTitle: "PT 129",
      prepTestNumber: "129",
      sectionId: "sec1",
      sectionType: "LR",
      sectionNumber: 1,
      questionNumber: 19,
      topicName: "Art",
      explanationHtml: "<p>Passage analysis body</p>",
      videoUrl: null,
      stimulusText: null,
      stemText: "Stem",
      choices: [{ id: "A", index: 1, text: "a", explanationHtml: null }],
      correctChoiceId: "A",
      passage: { id: "p1", displayNumber: 1, title: "P1", body: "" },
      answerPopularity: [],
      userSelectedLetter: null,
      difficulty: 3,
    }

    const view = buildExplanationQuestionDetailView(loc, detail)
    expect(view.hasExplanationTab).toBe(true)
    expect(view.videos[0]?.explanationHtml).toBe("<p>Passage analysis body</p>")
    expect(view.videos[1]?.explanationHtml).toBeNull()
    expect(view.videos[1]?.videoUrl).toBeNull()
  })

  it("shows analysis tab when only video explanation exists", () => {
    const detail: ExplanationDetailPayload = {
      questionId: "q1",
      prepTestId: "pt1",
      prepTestTitle: "PT 129",
      prepTestNumber: "129",
      sectionId: "sec1",
      sectionType: "LR",
      sectionNumber: 1,
      questionNumber: 19,
      topicName: "Art",
      explanationHtml: null,
      videoUrl: "https://example.com/v.mp4",
      stimulusText: null,
      stemText: "Stem",
      choices: [{ id: "A", index: 1, text: "a", explanationHtml: null }],
      correctChoiceId: "A",
      passage: { id: "p1", displayNumber: 1, title: "P1", body: "" },
      answerPopularity: [],
      userSelectedLetter: null,
      difficulty: 3,
    }

    const view = buildExplanationQuestionDetailView(loc, detail)
    expect(view.hasExplanationTab).toBe(true)
    expect(view.videos[0]?.explanationHtml).toBeNull()
    expect(view.videos[1]?.videoUrl).toBe("https://example.com/v.mp4")
  })

  it("maps passage difficulty label, tone, and caption from filled segments", () => {
    const detail: ExplanationDetailPayload = {
      questionId: "q1",
      prepTestId: "pt1",
      prepTestTitle: "PT 129",
      prepTestNumber: "129",
      sectionId: "sec1",
      sectionType: "RC",
      sectionNumber: 2,
      questionNumber: 2,
      topicName: "Art",
      explanationHtml: null,
      videoUrl: null,
      stimulusText: null,
      stemText: "Stem",
      choices: [{ id: "A", index: 1, text: "a", explanationHtml: null }],
      correctChoiceId: "A",
      passage: { id: "p1", displayNumber: 1, title: "P1", body: "" },
      answerPopularity: [],
      userSelectedLetter: null,
      difficulty: 3,
    }

    const view = buildExplanationQuestionDetailView(loc, detail)

    expect(view.analytics.questionDifficulty.label).toBe("Medium")
    expect(view.analytics.questionDifficulty.caption).toBe("75% of people who answer get this correct.")
    expect(view.analytics.passageDifficulty.filled).toBe(4)
    expect(view.analytics.passageDifficulty.label).toBe("Hard")
    expect(view.analytics.passageDifficulty.tone).toBe("red")
    expect(view.analytics.passageDifficulty.caption).toContain("moderately difficult question")
  })
})
