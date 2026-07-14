import type { DrillQuestion } from "@/features/student/drills/drill-types"

import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import {
  formatMiniDiagnosticPercentileRange,
  formatMiniDiagnosticScoreRange,
  resolveMiniDiagnosticScoreRange,
} from "@/features/guest/diagnostic/mini-diagnostic-content"
import type { GuestDiagnosticAnswerState } from "@/features/guest/diagnostic/guest-diagnostic-exam-utils"
import { getGuestDiagnosticTestConfig } from "@/features/guest/diagnostic/guest-diagnostic-test-config"

const GUEST_DIAGNOSTIC_RESULT_STORAGE_KEY = "guestDiagnosticResult"

type GuestDiagnosticQuestionOutcome = {
  questionId: string
  isCorrect: boolean
}

type GuestDiagnosticResult = {
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
  questionCount: number,
) {
  if (intentId === "mini") {
    const scoreRange = resolveMiniDiagnosticScoreRange(correctCount)
    const scaledMid = Math.round((scoreRange.scaledLow + scoreRange.scaledHigh) / 2)
    const percentileMid = (scoreRange.percentileLow + scoreRange.percentileHigh) / 2
    return {
      scaledScore: scaledMid,
      scaledScoreLow: scoreRange.scaledLow,
      scaledScoreHigh: scoreRange.scaledHigh,
      scaledScoreLabel: formatMiniDiagnosticScoreRange(scoreRange),
      percentile: percentileMid,
      percentileLow: scoreRange.percentileLow,
      percentileHigh: scoreRange.percentileHigh,
      percentileLabel: formatMiniDiagnosticPercentileRange(scoreRange),
    }
  }

  const ratio = questionCount > 0 ? correctCount / questionCount : 0
  const scaledScore = Math.round(120 + ratio * 60)
  const percentile = Math.round(ratio * 99 * 10) / 10
  return {
    scaledScore,
    scaledScoreLow: scaledScore,
    scaledScoreHigh: scaledScore,
    scaledScoreLabel: String(scaledScore),
    percentile,
    percentileLow: percentile,
    percentileHigh: percentile,
    percentileLabel: String(percentile),
  }
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
    const questionId = intentId === "mini" ? `mini-diag-q${index + 1}` : `guest-diagnostic-preview-q${index + 1}`
    return {
      questionId,
      isCorrect: index < correctCount,
    }
  })

  return {
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
): GuestDiagnosticResult {
  const outcomes: GuestDiagnosticQuestionOutcome[] = questions.map((question) => {
    const answer = answersByQuestion[question.id]
    const isCorrect = answer ? answer.isCorrect : false
    return { questionId: question.id, isCorrect }
  })

  const correctCount = outcomes.filter((outcome) => outcome.isCorrect).length
  const questionCount = questions.length

  return {
    intentId,
    completedAt: new Date().toISOString(),
    diagnosticNumber: 1,
    correctCount,
    questionCount,
    outcomes,
    ...buildResultScoreFields(intentId, correctCount, questionCount),
  }
}

function writeGuestDiagnosticResult(result: GuestDiagnosticResult): void {
  sessionStorage.setItem(GUEST_DIAGNOSTIC_RESULT_STORAGE_KEY, JSON.stringify(result))
}

function readGuestDiagnosticResult(): GuestDiagnosticResult | null {
  const raw = sessionStorage.getItem(GUEST_DIAGNOSTIC_RESULT_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as GuestDiagnosticResult
    if (!parsed || typeof parsed !== "object") return null
    if (!parsed.intentId || !Array.isArray(parsed.outcomes)) return null
    return parsed
  } catch {
    return null
  }
}

function formatDiagnosticDateLabel(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getDiagnosticIntentTitle(intentId: GuestDiagnosticIntentId): string {
  if (intentId === "mini") return "Mini Diagnostic"
  if (intentId === "quick") return "Quick Diagnostic"
  return "Full Diagnostic"
}

export {
  buildDefaultGuestDiagnosticResult,
  buildGuestDiagnosticResultFromAnswers,
  formatDiagnosticDateLabel,
  getDiagnosticIntentTitle,
  GUEST_DIAGNOSTIC_RESULT_STORAGE_KEY,
  readGuestDiagnosticResult,
  writeGuestDiagnosticResult,
  type GuestDiagnosticQuestionOutcome,
  type GuestDiagnosticResult,
}
