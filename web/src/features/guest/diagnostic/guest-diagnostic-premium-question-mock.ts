import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import {
  createMiniDiagnosticQuestions,
  getMiniDiagnosticExplanationHtml,
  getMiniDiagnosticQuestionMeta,
} from "@/features/guest/diagnostic/mini-diagnostic-content"

function buildGuestDiagnosticPremiumQuestionDetail(questionId: string): ExplanationDetailPayload | null {
  const questions = createMiniDiagnosticQuestions()
  const question = questions.find((item) => item.id === questionId)
  if (!question) return null

  const meta = getMiniDiagnosticQuestionMeta(questionId)

  return {
    questionId: question.id,
    prepTestId: "diag-mini",
    prepTestTitle: "Mini Diagnostic",
    prepTestNumber: "Mini",
    sectionId: "diag-mini-lr",
    sectionType: "LR",
    sectionNumber: 1,
    questionNumber: question.questionNumber ?? 1,
    topicName: meta?.questionType ?? "Logical Reasoning",
    tags: ["LR", meta?.questionType ?? "Mini Diagnostic"],
    explanationHtml: getMiniDiagnosticExplanationHtml(questionId),
    videoUrl: null,
    stimulusText: question.stimulusText,
    stemText: question.stemText,
    choices: question.choices.map((choice) => ({
      id: choice.id.toLowerCase(),
      index: choice.index,
      text: choice.text,
      explanationHtml: choice.explanationHtml ?? null,
    })),
    correctChoiceId: question.correctChoiceId?.toLowerCase() ?? null,
    passage: {
      id: "diag-mini-passage",
      displayNumber: 1,
      title: "Mini Diagnostic",
      body: "",
    },
    answerPopularity: [],
    difficulty: meta?.difficulty,
  }
}

export { buildGuestDiagnosticPremiumQuestionDetail }
