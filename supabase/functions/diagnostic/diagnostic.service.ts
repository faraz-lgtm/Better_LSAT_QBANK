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
  videoUrl: string | null
  choices: MiniDiagnosticExplanationChoice[]
}

export type DiagnosticVideoUrl = {
  sourceItemId: string
  videoUrl: string
}

export type MiniDiagnosticExplanationsResponse = {
  explanationsLocked: boolean
  explanations: MiniDiagnosticExplanation[]
  /** Mini + Section diagnostic videos (always returned when present, even if written explanations are locked). */
  videoUrls: DiagnosticVideoUrl[]
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

function mapQuestionRow(
  row: Awaited<ReturnType<DiagnosticRepository['listMiniDiagnosticQuestions']>>[number],
): MiniDiagnosticExplanation {
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
    videoUrl: row.video_url?.trim() || null,
    choices: parsedChoices.map((choice) => ({
      letter: choice.id.toUpperCase(),
      text: choice.text,
      explanation: choice.explanationHtml,
    })),
  }
}

function mapLockedVideoStub(
  row: Awaited<ReturnType<DiagnosticRepository['listMiniDiagnosticQuestions']>>[number],
): MiniDiagnosticExplanation {
  return {
    sourceItemId: row.source_item_id,
    questionNumber: row.question_number ?? 0,
    questionType: null,
    difficulty: null,
    stimulusText: null,
    stemText: '',
    correctAnswer: null,
    explanationHtml: null,
    videoUrl: row.video_url?.trim() || null,
    choices: [],
  }
}

function mapVideoUrlRows(
  rows: Awaited<ReturnType<DiagnosticRepository['listDiagnosticVideoUrls']>>,
): DiagnosticVideoUrl[] {
  const out: DiagnosticVideoUrl[] = []
  for (const row of rows) {
    const videoUrl = row.video_url?.trim()
    if (!videoUrl) continue
    out.push({ sourceItemId: row.source_item_id, videoUrl })
  }
  return out
}

export function createDiagnosticService(deps: DiagnosticServiceDeps) {
  return {
    async getMiniDiagnosticExplanations(userId: string): Promise<MiniDiagnosticExplanationsResponse> {
      const hasActiveCore = await resolveHasActiveCore(userId, deps.hasActiveSubscription)
      const [rows, videoRows] = await Promise.all([
        deps.repository.listMiniDiagnosticQuestions(),
        deps.repository.listDiagnosticVideoUrls(),
      ])
      const videoUrls = mapVideoUrlRows(videoRows)

      if (!hasActiveCore) {
        return {
          explanationsLocked: true,
          explanations: rows.map(mapLockedVideoStub),
          videoUrls,
        }
      }

      return {
        explanationsLocked: false,
        explanations: rows.map(mapQuestionRow),
        videoUrls,
      }
    },
  }
}

export type DiagnosticService = ReturnType<typeof createDiagnosticService>
