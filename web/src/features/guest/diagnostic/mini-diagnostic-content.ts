import type { DrillQuestion } from "@/features/student/drills/drill-types"
import {
  MINI_DIAGNOSTIC_MARKETING_SET,
  formatMiniDiagnosticPercentileRange,
  formatMiniDiagnosticScoreRange,
  resolveMiniDiagnosticScoreRange,
} from "@data/diagnostics/mini-marketing-set.ts"
import type { MiniDiagnosticQuestion } from "@data/diagnostics/mini-marketing-types.ts"

function mapMiniDiagnosticQuestionToDrill(question: MiniDiagnosticQuestion): DrillQuestion {
  return {
    id: question.sourceItemId,
    questionNumber: question.questionNumber,
    stimulusText: question.stimulusText,
    stemText: question.stemText,
    passage: null,
    correctChoiceId: question.correctAnswer,
    choices: question.choices.map((choice, index) => ({
      id: choice.letter,
      index,
      text: choice.text,
      explanationHtml: choice.explanation ?? null,
    })),
  }
}

function createMiniDiagnosticQuestions(): DrillQuestion[] {
  return MINI_DIAGNOSTIC_MARKETING_SET.questions.map(mapMiniDiagnosticQuestionToDrill)
}

function createGuestDiagnosticPreviewQuestions(questionCount: number): DrillQuestion[] {
  const miniQuestions = createMiniDiagnosticQuestions()
  if (questionCount <= miniQuestions.length) {
    return miniQuestions.slice(0, questionCount)
  }
  return Array.from({ length: questionCount }, (_, index) => {
    const template = miniQuestions[index % miniQuestions.length]!
    return {
      ...template,
      id: `guest-diagnostic-preview-q${index + 1}`,
      questionNumber: index + 1,
    }
  })
}

function getMiniDiagnosticExplanationHtml(questionId: string): string | null {
  const question = MINI_DIAGNOSTIC_MARKETING_SET.questions.find((q) => q.sourceItemId === questionId)
  return question?.explanationHtml ?? null
}

function getMiniDiagnosticQuestionMeta(questionId: string) {
  const question = MINI_DIAGNOSTIC_MARKETING_SET.questions.find((q) => q.sourceItemId === questionId)
  if (!question) return null
  return {
    questionType: question.questionType,
    difficulty: question.difficulty,
    targetTimeSeconds: question.targetTimeSeconds,
    explanationHtml: question.explanationHtml,
  }
}

export {
  MINI_DIAGNOSTIC_MARKETING_SET,
  createGuestDiagnosticPreviewQuestions,
  createMiniDiagnosticQuestions,
  formatMiniDiagnosticPercentileRange,
  formatMiniDiagnosticScoreRange,
  getMiniDiagnosticExplanationHtml,
  getMiniDiagnosticQuestionMeta,
  mapMiniDiagnosticQuestionToDrill,
  resolveMiniDiagnosticScoreRange,
}
