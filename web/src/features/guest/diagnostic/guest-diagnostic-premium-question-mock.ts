import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"

function buildGuestDiagnosticPremiumQuestionDetail(index: number): ExplanationDetailPayload {
  const questionNumber = 18 + index
  return {
    questionId: `guest-diagnostic-preview-q${index}`,
    prepTestId: "pt-129",
    prepTestTitle: "PrepTest 129",
    prepTestNumber: "129",
    sectionId: "s1",
    sectionType: "LR",
    sectionNumber: 1,
    questionNumber,
    topicName: "Flaw",
    tags: ["LR", "Medium", "Flaw"],
    explanationHtml: null,
    videoUrl: null,
    stimulusText: null,
    stemText: null,
    choices: [
      { id: "a", index: 0, text: "Choice A", explanationHtml: null },
      { id: "b", index: 1, text: "Choice B", explanationHtml: null },
      { id: "c", index: 2, text: "Choice C", explanationHtml: null },
      { id: "d", index: 3, text: "Choice D", explanationHtml: null },
      { id: "e", index: 4, text: "Choice E", explanationHtml: null },
    ],
    correctChoiceId: "c",
    passage: {
      id: "passage-1",
      displayNumber: 1,
      title: "Passage 1",
      body: "",
    },
    answerPopularity: [
      { letter: "A", count: 12, pct: 18 },
      { letter: "B", count: 8, pct: 12 },
      { letter: "C", count: 34, pct: 51, highlight: true },
      { letter: "D", count: 9, pct: 13 },
      { letter: "E", count: 4, pct: 6 },
    ],
    difficulty: 3,
  }
}

export { buildGuestDiagnosticPremiumQuestionDetail }
