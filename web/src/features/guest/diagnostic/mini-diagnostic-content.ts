import type { DrillQuestion } from "@/features/student/drills/drill-types"
import {
  MINI_DIAGNOSTIC_MARKETING_SET,
  formatMiniDiagnosticPercentileRange,
  formatMiniDiagnosticScoreRange,
  resolveMiniDiagnosticScoreRange,
} from "@data/diagnostics/mini-marketing-set.ts"
import type { MiniDiagnosticQuestion } from "@data/diagnostics/mini-marketing-types.ts"
import type { MiniDiagnosticExplanation } from "@/lib/api/diagnostic"

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

const PREVIEW_QUESTION_ID = /^guest-diagnostic-preview-q(\d+)$/i

function resolveMiniDiagnosticSourceQuestion(questionId: string): MiniDiagnosticQuestion | null {
  const direct = MINI_DIAGNOSTIC_MARKETING_SET.questions.find((question) => question.sourceItemId === questionId)
  if (direct) return direct
  const match = PREVIEW_QUESTION_ID.exec(questionId.trim())
  if (!match) return null
  const number = Number(match[1])
  const questions = MINI_DIAGNOSTIC_MARKETING_SET.questions
  if (!Number.isFinite(number) || number < 1 || questions.length === 0) return null
  return questions[(number - 1) % questions.length] ?? null
}

function getMiniDiagnosticExplanationHtml(questionId: string): string | null {
  return resolveMiniDiagnosticSourceQuestion(questionId)?.explanationHtml ?? null
}

function getMiniDiagnosticQuestionMeta(questionId: string) {
  const question = resolveMiniDiagnosticSourceQuestion(questionId)
  if (!question) return null
  return {
    questionType: question.questionType,
    difficulty: question.difficulty,
    targetTimeSeconds: question.targetTimeSeconds,
    explanationHtml: question.explanationHtml,
  }
}

function buildDiagnosticResultExplanation(questionId: string): MiniDiagnosticExplanation | null {
  const question = resolveMiniDiagnosticSourceQuestion(questionId)
  if (!question) return null
  return {
    sourceItemId: questionId,
    questionNumber: question.questionNumber,
    questionType: question.questionType,
    difficulty: question.difficulty,
    stimulusText: question.stimulusText,
    stemText: question.stemText,
    correctAnswer: question.correctAnswer,
    explanationHtml: question.explanationHtml,
    choices: question.choices.map((choice) => ({
      letter: choice.letter,
      text: choice.text,
      explanation: choice.explanation ?? null,
    })),
  }
}

export {
  MINI_DIAGNOSTIC_MARKETING_SET,
  buildDiagnosticResultExplanation,
  createGuestDiagnosticPreviewQuestions,
  createMiniDiagnosticQuestions,
  formatMiniDiagnosticPercentileRange,
  formatMiniDiagnosticScoreRange,
  getMiniDiagnosticExplanationHtml,
  getMiniDiagnosticQuestionMeta,
  mapMiniDiagnosticQuestionToDrill,
  resolveMiniDiagnosticScoreRange,
}
