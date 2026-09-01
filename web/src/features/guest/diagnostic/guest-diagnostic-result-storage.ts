import type { DrillQuestion } from "@/features/student/drills/drill-types"

import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import {
  formatDiagnosticPercentileRange,
  formatDiagnosticScoreRange,
  resolveDiagnosticScoreRange,
} from "@/features/guest/diagnostic/mini-diagnostic-content"
import type { GuestDiagnosticAnswerState } from "@/features/guest/diagnostic/guest-diagnostic-exam-utils"
import { getGuestDiagnosticTestConfig } from "@/features/guest/diagnostic/guest-diagnostic-test-config"
import {
  diagnosticResultsSectionFromIntent,
  type DiagnosticResultsSection,
} from "@/features/student/diagnostic/diagnostic-results-routes"

const GUEST_DIAGNOSTIC_RESULT_STORAGE_KEY = "guestDiagnosticResult"
const DIAGNOSTIC_ATTEMPT_HISTORY_STORAGE_KEY = "lsat.diagnostic-attempt-history"

type GuestDiagnosticQuestionOutcome = {
  questionId: string
  isCorrect: boolean
  selectedAnswer?: string | null
  /** Seconds spent on this question during the attempt (when tracked). */
  timeSpentSeconds?: number | null
}

type GuestDiagnosticResult = {
  id: string
  intentId: GuestDiagnosticIntentId
  completedAt: string
  diagnosticNumber: number
  scaledScore: number
  scaledScoreLow: number
  scaledScoreHigh: number
  scaledScoreLabel: string
  percentile: number
  percentileLow: number
  percentileHigh: number
  percentileLabel: string
  correctCount: number
  questionCount: number
  outcomes: GuestDiagnosticQuestionOutcome[]
}

function buildResultScoreFields(
  intentId: GuestDiagnosticIntentId,
  correctCount: number,
  _questionCount: number,
) {
  const scoreRange = resolveDiagnosticScoreRange(intentId, correctCount)
  const scaledMid = Math.round((scoreRange.scaledLow + scoreRange.scaledHigh) / 2)
  const percentileMid = (scoreRange.percentileLow + scoreRange.percentileHigh) / 2
  return {
    scaledScore: scaledMid,
    scaledScoreLow: scoreRange.scaledLow,
    scaledScoreHigh: scoreRange.scaledHigh,
    scaledScoreLabel: formatDiagnosticScoreRange(intentId, scoreRange),
    percentile: percentileMid,
    percentileLow: scoreRange.percentileLow,
    percentileHigh: scoreRange.percentileHigh,
    percentileLabel: formatDiagnosticPercentileRange(intentId, scoreRange),
  }
}

function newDiagnosticAttemptId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `diag-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function parseGuestDiagnosticResult(value: unknown): GuestDiagnosticResult | null {
  if (!value || typeof value !== "object") return null
  const parsed = value as Partial<GuestDiagnosticResult>
  if (!parsed.intentId || !Array.isArray(parsed.outcomes)) return null
  const completedAt =
    typeof parsed.completedAt === "string" && parsed.completedAt.trim()
      ? parsed.completedAt
      : new Date().toISOString()
  return {
    ...(parsed as GuestDiagnosticResult),
    id: typeof parsed.id === "string" && parsed.id.trim() ? parsed.id : newDiagnosticAttemptId(),
    completedAt,
    diagnosticNumber: Number.isFinite(parsed.diagnosticNumber) ? Number(parsed.diagnosticNumber) : 1,
  }
}

function readDiagnosticHistoryRaw(): GuestDiagnosticResult[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(DIAGNOSTIC_ATTEMPT_HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(parseGuestDiagnosticResult).filter((row): row is GuestDiagnosticResult => row != null)
  } catch {
    return []
  }
}

function stampDisplayNumbers(attempts: GuestDiagnosticResult[]): GuestDiagnosticResult[] {
  const bySection: Record<DiagnosticResultsSection, GuestDiagnosticResult[]> = { mini: [], full: [] }
  const chronological = [...attempts].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  )
  for (const attempt of chronological) {
    bySection[diagnosticResultsSectionFromIntent(attempt.intentId)].push(attempt)
  }
  const numbers = new Map<string, number>()
  for (const section of ["mini", "full"] as const) {
    bySection[section].forEach((attempt, index) => {
      numbers.set(attempt.id, index + 1)
    })
  }
  return attempts.map((attempt) => ({
    ...attempt,
    diagnosticNumber: numbers.get(attempt.id) ?? attempt.diagnosticNumber,
  }))
}

function writeDiagnosticHistoryRaw(attempts: GuestDiagnosticResult[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DIAGNOSTIC_ATTEMPT_HISTORY_STORAGE_KEY, JSON.stringify(attempts))
}

function readSessionDiagnosticResult(): GuestDiagnosticResult | null {
  if (typeof window === "undefined") return null
  const raw = window.sessionStorage.getItem(GUEST_DIAGNOSTIC_RESULT_STORAGE_KEY)
  if (!raw) return null
  try {
    return parseGuestDiagnosticResult(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

function listDiagnosticHistory(): GuestDiagnosticResult[] {
  const stored = readDiagnosticHistoryRaw()
  const session = readSessionDiagnosticResult()
  let attempts = stored
  if (
    session &&
    !stored.some(
      (row) =>
        row.id === session.id ||
        (row.intentId === session.intentId && row.completedAt === session.completedAt),
    )
  ) {
    attempts = [session, ...stored]
    writeDiagnosticHistoryRaw(attempts)
  }
  const stamped = stampDisplayNumbers(attempts)
  return [...stamped].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  )
}

function listDiagnosticHistoryBySection(section: DiagnosticResultsSection): GuestDiagnosticResult[] {
  return listDiagnosticHistory().filter(
    (attempt) => diagnosticResultsSectionFromIntent(attempt.intentId) === section,
  )
}

function getDiagnosticAttempt(attemptId: string): GuestDiagnosticResult | null {
  const id = attemptId.trim()
  if (!id) return null
  return listDiagnosticHistory().find((attempt) => attempt.id === id) ?? null
}

/** Demo outcomes for preview routes when no submission exists yet. */
function buildDefaultGuestDiagnosticResult(intentId: GuestDiagnosticIntentId): GuestDiagnosticResult {
  const config = getGuestDiagnosticTestConfig(intentId)
  const questionCount = config.questionCount

  let correctCount: number
  if (intentId === "mini") {
    correctCount = 3
  } else if (intentId === "quick") {
    correctCount = 18
  } else {
    correctCount = 66
  }

  const outcomes: GuestDiagnosticQuestionOutcome[] = Array.from({ length: questionCount }, (_, index) => {
    const questionId =
      intentId === "mini"
        ? `mini-diag-q${index + 1}`
        : intentId === "quick"
          ? `section-diag-q${index + 1}`
          : `guest-diagnostic-preview-q${index + 1}`
    const isCorrect = index < correctCount
    return {
      questionId,
      isCorrect,
      selectedAnswer: isCorrect ? "C" : "A",
      timeSpentSeconds: 40 + ((index * 17) % 80),
    }
  })

  return {
    id: newDiagnosticAttemptId(),
    intentId,
    completedAt: new Date().toISOString(),
    diagnosticNumber: 1,
    correctCount,
    questionCount,
    outcomes,
    ...buildResultScoreFields(intentId, correctCount, questionCount),
  }
}

function buildGuestDiagnosticResultFromAnswers(
  intentId: GuestDiagnosticIntentId,
  questions: DrillQuestion[],
  answersByQuestion: Record<string, GuestDiagnosticAnswerState>,
  timeSpentByQuestion?: Readonly<Record<string, number>>,
): GuestDiagnosticResult {
  const outcomes: GuestDiagnosticQuestionOutcome[] = questions.map((question) => {
    const answer = answersByQuestion[question.id]
    const isCorrect = answer ? answer.isCorrect : false
    const spent = timeSpentByQuestion?.[question.id]
    return {
      questionId: question.id,
      isCorrect,
      selectedAnswer: answer?.selectedAnswer ?? null,
      timeSpentSeconds: typeof spent === "number" && Number.isFinite(spent) ? Math.max(0, Math.round(spent)) : null,
    }
  })

  const correctCount = outcomes.filter((outcome) => outcome.isCorrect).length
  const questionCount = questions.length

  return {
    id: newDiagnosticAttemptId(),
    intentId,
    completedAt: new Date().toISOString(),
    diagnosticNumber: 1,
    correctCount,
    questionCount,
    outcomes,
    ...buildResultScoreFields(intentId, correctCount, questionCount),
  }
}

function writeGuestDiagnosticResult(result: GuestDiagnosticResult): GuestDiagnosticResult {
  const parsed = parseGuestDiagnosticResult(result)
  if (!parsed) throw new Error("Invalid diagnostic result")
  const previous = readDiagnosticHistoryRaw().filter((row) => row.id !== parsed.id)
  const next = stampDisplayNumbers([parsed, ...previous])
  const saved = next.find((row) => row.id === parsed.id) ?? parsed
  writeDiagnosticHistoryRaw(next)
  sessionStorage.setItem(GUEST_DIAGNOSTIC_RESULT_STORAGE_KEY, JSON.stringify(saved))
  return saved
}

function readGuestDiagnosticResult(): GuestDiagnosticResult | null {
  return readSessionDiagnosticResult() ?? listDiagnosticHistory()[0] ?? null
}

function formatDiagnosticDateLabel(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getDiagnosticIntentTitle(intentId: GuestDiagnosticIntentId): string {
  if (intentId === "mini") return "Mini Diagnostic"
  if (intentId === "quick") return "Full Section Diagnostic"
  return "Full Diagnostic"
}

export {
  buildDefaultGuestDiagnosticResult,
  buildGuestDiagnosticResultFromAnswers,
  DIAGNOSTIC_ATTEMPT_HISTORY_STORAGE_KEY,
  formatDiagnosticDateLabel,
  getDiagnosticAttempt,
  getDiagnosticIntentTitle,
  GUEST_DIAGNOSTIC_RESULT_STORAGE_KEY,
  listDiagnosticHistory,
  listDiagnosticHistoryBySection,
  readGuestDiagnosticResult,
  writeGuestDiagnosticResult,
  type GuestDiagnosticQuestionOutcome,
  type GuestDiagnosticResult,
}
