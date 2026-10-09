import { resolveGumletCssAspectRatios } from '../_shared/gumlet-aspect-ratio.ts'
import { parseQuestionChoices } from '../_shared/parse-question-choices.ts'
import { parseStripeEnv } from '../_shared/stripe-env.ts'
import type { DiagnosticRepository } from './diagnostic.repository.ts'

/** Free Mini Diagnostic: first N written explanations unlocked. */
const FREE_MINI_DIAGNOSTIC_EXPLANATION_LIMIT = 5
/** Free Full Section / Full Diagnostic: first N explanations unlocked. */
const FREE_SECTION_DIAGNOSTIC_EXPLANATION_LIMIT = 10

const MINI_DIAG_VIDEO_ID = /^mini-diag-q(\d+)$/i
const SECTION_DIAG_VIDEO_ID = /^section-diag-q(\d+)$/i

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
  /** CSS aspect-ratio from Gumlet oEmbed when available (e.g. `"800 / 392"`). */
  aspectRatio: string | null
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

function freeTeaserAllowsVideo(sourceItemId: string): boolean {
  const mini = MINI_DIAG_VIDEO_ID.exec(sourceItemId)
  if (mini) {
    const n = Number.parseInt(mini[1] ?? '', 10)
    return Number.isFinite(n) && n >= 1 && n <= FREE_MINI_DIAGNOSTIC_EXPLANATION_LIMIT
  }
  const section = SECTION_DIAG_VIDEO_ID.exec(sourceItemId)
  if (section) {
    const n = Number.parseInt(section[1] ?? '', 10)
    return Number.isFinite(n) && n >= 1 && n <= FREE_SECTION_DIAGNOSTIC_EXPLANATION_LIMIT
  }
  return false
}

function mapFreeTeaserExplanation(
  row: Awaited<ReturnType<DiagnosticRepository['listMiniDiagnosticQuestions']>>[number],
): MiniDiagnosticExplanation {
  const questionNumber = row.question_number ?? 0
  if (questionNumber >= 1 && questionNumber <= FREE_MINI_DIAGNOSTIC_EXPLANATION_LIMIT) {
    return mapQuestionRow(row)
  }
  return mapLockedVideoStub(row)
}

async function mapVideoUrlRows(
  rows: Awaited<ReturnType<DiagnosticRepository['listDiagnosticVideoUrls']>>,
  fetchFn: typeof fetch = fetch,
  options: { freeTeaserOnly?: boolean } = {},
): Promise<DiagnosticVideoUrl[]> {
  const basic: { sourceItemId: string; videoUrl: string }[] = []
  for (const row of rows) {
    const videoUrl = row.video_url?.trim()
    if (!videoUrl) continue
    if (options.freeTeaserOnly && !freeTeaserAllowsVideo(row.source_item_id)) continue
    basic.push({ sourceItemId: row.source_item_id, videoUrl })
  }
  const ratioByUrl = await resolveGumletCssAspectRatios(
    basic.map((row) => row.videoUrl),
    fetchFn,
  )
  return basic.map((row) => ({
    ...row,
    aspectRatio: ratioByUrl.get(row.videoUrl) ?? null,
  }))
}

export type DiagnosticServiceOptions = {
  fetchFn?: typeof fetch
}

export function createDiagnosticService(
  deps: DiagnosticServiceDeps,
  options: DiagnosticServiceOptions = {},
) {
  const fetchFn = options.fetchFn ?? fetch
  return {
    async getMiniDiagnosticExplanations(userId: string): Promise<MiniDiagnosticExplanationsResponse> {
      const hasActiveCore = await resolveHasActiveCore(userId, deps.hasActiveSubscription)
      const [rows, videoRows] = await Promise.all([
        deps.repository.listMiniDiagnosticQuestions(),
        deps.repository.listDiagnosticVideoUrls(),
      ])
      if (!hasActiveCore) {
        const videoUrls = await mapVideoUrlRows(videoRows, fetchFn, { freeTeaserOnly: true })
        return {
          // Still locked overall — free plan only gets the teaser window (Q1–5 mini).
          explanationsLocked: true,
          explanations: rows.map(mapFreeTeaserExplanation),
          videoUrls,
        }
      }

      const videoUrls = await mapVideoUrlRows(videoRows, fetchFn)
      return {
        explanationsLocked: false,
        explanations: rows.map(mapQuestionRow),
        videoUrls,
      }
    },
  }
}

export type DiagnosticService = ReturnType<typeof createDiagnosticService>
