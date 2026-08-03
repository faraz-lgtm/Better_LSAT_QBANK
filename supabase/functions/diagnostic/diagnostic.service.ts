import { parseQuestionChoices } from '../_shared/parse-question-choices.ts'
import { parseStripeEnv } from '../_shared/stripe-env.ts'
import type { DiagnosticRepository } from './diagnostic.repository.ts'

export type MiniDiagnosticExplanationChoice = {
  letter: string
  text: string
  explanation: string | null
}

export type MiniDiagnosticExplanation = {
  sourceItemId: string
  questionNumber: number
  questionType: string | null
  difficulty: number | null
  stimulusText: string | null
  stemText: string
  correctAnswer: string | null
  explanationHtml: string | null
  choices: MiniDiagnosticExplanationChoice[]
}

export type MiniDiagnosticExplanationsResponse = {
  explanationsLocked: boolean
  explanations: MiniDiagnosticExplanation[]
}

export type DiagnosticServiceDeps = {
  repository: DiagnosticRepository
  hasActiveSubscription: (userId: string) => Promise<boolean>
}

function clampDifficulty(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null
  const rounded = Math.round(value)
  if (rounded < 1 || rounded > 5) return null
  return rounded
}

async function resolveHasActiveCore(
  userId: string,
  hasActiveSubscription: (userId: string) => Promise<boolean>,
): Promise<boolean> {
  const stripeConfigured = parseStripeEnv(Deno.env.toObject()) !== null
  if (!stripeConfigured) return true
  return await hasActiveSubscription(userId)
}

function mapQuestionRow(row: Awaited<ReturnType<DiagnosticRepository['listMiniDiagnosticQuestions']>>[number]): MiniDiagnosticExplanation {
  const parsedChoices = parseQuestionChoices(row.choices, { includeOptionExplanations: true })
  return {
    sourceItemId: row.source_item_id,
    questionNumber: row.question_number ?? 0,
    questionType: row.source_label?.trim() || null,
    difficulty: clampDifficulty(row.difficulty),
    stimulusText: row.stimulus_text,
    stemText: row.stem_text ?? '',
    correctAnswer: row.correct_answer?.trim().toUpperCase() ?? null,
    explanationHtml: row.explanation?.trim() || null,
    choices: parsedChoices.map((choice) => ({
      letter: choice.id.toUpperCase(),
      text: choice.text,
      explanation: choice.explanationHtml,
    })),
  }
}

export function createDiagnosticService(deps: DiagnosticServiceDeps) {
  return {
    async getMiniDiagnosticExplanations(userId: string): Promise<MiniDiagnosticExplanationsResponse> {
      const hasActiveCore = await resolveHasActiveCore(userId, deps.hasActiveSubscription)
      if (!hasActiveCore) {
        return { explanationsLocked: true, explanations: [] }
      }

      const rows = await deps.repository.listMiniDiagnosticQuestions()
      return {
        explanationsLocked: false,
        explanations: rows.map(mapQuestionRow),
      }
    },
  }
}

export type DiagnosticService = ReturnType<typeof createDiagnosticService>
