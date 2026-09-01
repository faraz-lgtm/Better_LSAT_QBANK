import type { DrillQuestion } from "@/features/student/drills/drill-types"
import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import {
  MINI_DIAGNOSTIC_MARKETING_SET,
  formatMiniDiagnosticPercentileRange,
  formatMiniDiagnosticScoreRange,
  resolveMiniDiagnosticScoreRange,
} from "@data/diagnostics/mini-marketing-set.ts"
import {
  buildSectionDiagnosticMarketingSet,
  formatSectionDiagnosticPercentileRange,
  formatSectionDiagnosticScoreRange,
  resolveSectionDiagnosticScoreRange,
} from "@data/diagnostics/section-marketing-set.ts"
import { SECTION_DIAGNOSTIC_QUESTIONS } from "@data/diagnostics/section-marketing-questions.ts"
import type { MiniDiagnosticQuestion } from "@data/diagnostics/mini-marketing-types.ts"
import type { MiniDiagnosticExplanation } from "@/lib/api/diagnostic"

const SECTION_DIAGNOSTIC_MARKETING_SET = buildSectionDiagnosticMarketingSet(
  SECTION_DIAGNOSTIC_QUESTIONS,
)

function getDiagnosticMarketingSet(intentId: GuestDiagnosticIntentId) {
  if (intentId === "mini") return MINI_DIAGNOSTIC_MARKETING_SET
  return SECTION_DIAGNOSTIC_MARKETING_SET
}

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

function createSectionDiagnosticQuestions(): DrillQuestion[] {
  return SECTION_DIAGNOSTIC_QUESTIONS.map(mapMiniDiagnosticQuestionToDrill)
}

function extendDiagnosticQuestions(base: DrillQuestion[], questionCount: number): DrillQuestion[] {
  if (questionCount <= base.length) return base.slice(0, questionCount)
  return Array.from({ length: questionCount }, (_, index) => {
    const template = base[index % base.length]!
    return {
      ...template,
      id: `guest-diagnostic-preview-q${index + 1}`,
      questionNumber: index + 1,
    }
  })
}

function createDiagnosticQuestions(intentId: GuestDiagnosticIntentId): DrillQuestion[] {
  if (intentId === "mini") return createMiniDiagnosticQuestions()
  if (intentId === "quick") return createSectionDiagnosticQuestions()
  return extendDiagnosticQuestions(createSectionDiagnosticQuestions(), 115)
}

/** @deprecated Use createDiagnosticQuestions(intentId) */
function createGuestDiagnosticPreviewQuestions(questionCount: number): DrillQuestion[] {
  if (questionCount <= 10) return createMiniDiagnosticQuestions().slice(0, questionCount)
  if (questionCount <= 25) return createSectionDiagnosticQuestions().slice(0, questionCount)
  return extendDiagnosticQuestions(createSectionDiagnosticQuestions(), questionCount)
}

const PREVIEW_QUESTION_ID = /^guest-diagnostic-preview-q(\d+)$/i

function resolveDiagnosticSourceQuestion(
  questionId: string,
  intentId?: GuestDiagnosticIntentId,
): MiniDiagnosticQuestion | null {
  const sets = intentId
    ? [getDiagnosticMarketingSet(intentId)]
    : [MINI_DIAGNOSTIC_MARKETING_SET, SECTION_DIAGNOSTIC_MARKETING_SET]

  for (const set of sets) {
    const direct = set.questions.find((question) => question.sourceItemId === questionId)
    if (direct) return direct
  }

  const previewMatch = PREVIEW_QUESTION_ID.exec(questionId.trim())
  if (previewMatch) {
    const number = Number(previewMatch[1])
    const questions = SECTION_DIAGNOSTIC_MARKETING_SET.questions
    if (Number.isFinite(number) && number >= 1 && questions.length > 0) {
      return questions[(number - 1) % questions.length] ?? null
    }
  }

  return null
}

function getDiagnosticExplanationHtml(
  questionId: string,
  intentId?: GuestDiagnosticIntentId,
): string | null {
  return resolveDiagnosticSourceQuestion(questionId, intentId)?.explanationHtml ?? null
}

/** @deprecated Use getDiagnosticExplanationHtml(questionId, intentId) */
function getMiniDiagnosticExplanationHtml(questionId: string): string | null {
  return getDiagnosticExplanationHtml(questionId)
}

function getDiagnosticQuestionMeta(questionId: string, intentId?: GuestDiagnosticIntentId) {
  const question = resolveDiagnosticSourceQuestion(questionId, intentId)
  if (!question) return null
  return {
    questionType: question.questionType,
    difficulty: question.difficulty,
    targetTimeSeconds: question.targetTimeSeconds,
    explanationHtml: question.explanationHtml,
  }
}

/** @deprecated Use getDiagnosticQuestionMeta(questionId, intentId) */
function getMiniDiagnosticQuestionMeta(questionId: string) {
  return getDiagnosticQuestionMeta(questionId)
}

function buildDiagnosticResultExplanation(
  questionId: string,
  intentId?: GuestDiagnosticIntentId,
): MiniDiagnosticExplanation | null {
  const question = resolveDiagnosticSourceQuestion(questionId, intentId)
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

function resolveDiagnosticScoreRange(intentId: GuestDiagnosticIntentId, correctCount: number) {
  if (intentId === "mini") return resolveMiniDiagnosticScoreRange(correctCount)
  return resolveSectionDiagnosticScoreRange(correctCount)
}

function formatDiagnosticScoreRange(intentId: GuestDiagnosticIntentId, range: ReturnType<typeof resolveMiniDiagnosticScoreRange>) {
  if (intentId === "mini") return formatMiniDiagnosticScoreRange(range)
  return formatSectionDiagnosticScoreRange(range)
}

function formatDiagnosticPercentileRange(
  intentId: GuestDiagnosticIntentId,
  range: ReturnType<typeof resolveMiniDiagnosticScoreRange>,
) {
  if (intentId === "mini") return formatMiniDiagnosticPercentileRange(range)
  return formatSectionDiagnosticPercentileRange(range)
}

export {
  MINI_DIAGNOSTIC_MARKETING_SET,
  SECTION_DIAGNOSTIC_MARKETING_SET,
  buildDiagnosticResultExplanation,
  createDiagnosticQuestions,
  createGuestDiagnosticPreviewQuestions,
  createMiniDiagnosticQuestions,
  createSectionDiagnosticQuestions,
  formatDiagnosticPercentileRange,
  formatDiagnosticScoreRange,
  formatMiniDiagnosticPercentileRange,
  formatMiniDiagnosticScoreRange,
  getDiagnosticExplanationHtml,
  getDiagnosticQuestionMeta,
  getMiniDiagnosticExplanationHtml,
  getMiniDiagnosticQuestionMeta,
  mapMiniDiagnosticQuestionToDrill,
  resolveDiagnosticScoreRange,
  resolveMiniDiagnosticScoreRange,
  resolveSectionDiagnosticScoreRange,
}
