import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
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
  percentile: number
  correctCount: number
  questionCount: number
  outcomes: GuestDiagnosticQuestionOutcome[]
}

/** Demo outcomes aligned with Figma `19512:24718` (mini: 3/10 correct, score 167). */
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
    const questionId = `guest-diagnostic-preview-q${index + 1}`
    return {
      questionId,
      isCorrect: index < correctCount,
    }
  })

  return {
    intentId,
    completedAt: new Date().toISOString(),
    diagnosticNumber: 1,
    scaledScore: 167,
    percentile: 90.6,
    correctCount,
    questionCount,
    outcomes,
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
  formatDiagnosticDateLabel,
  getDiagnosticIntentTitle,
  GUEST_DIAGNOSTIC_RESULT_STORAGE_KEY,
  readGuestDiagnosticResult,
  writeGuestDiagnosticResult,
  type GuestDiagnosticQuestionOutcome,
  type GuestDiagnosticResult,
}
