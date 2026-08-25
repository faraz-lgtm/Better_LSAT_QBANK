import { useEffect, useMemo } from "react"
import { Navigate, useNavigate } from "react-router-dom"

import {
  GuestDiagnosticExamLayout,
  type GuestDiagnosticExamMode,
} from "@/features/guest/diagnostic/guest-diagnostic-exam-layout"
import type { GuestDiagnosticAnswerState } from "@/features/guest/diagnostic/guest-diagnostic-exam-utils"
import {
  buildDefaultGuestDiagnosticResult,
  readGuestDiagnosticResult,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import {
  getGuestDiagnosticTestConfig,
  isGuestDiagnosticIntentId,
} from "@/features/guest/diagnostic/guest-diagnostic-test-config"
import { diagnosticAttemptHref } from "@/features/student/diagnostic/diagnostic-results-routes"
import { useDiagnosticSubscription } from "@/features/guest/diagnostic/use-diagnostic-subscription"
import { PracticeSessionImmersiveFrame } from "@/features/student/practice-session/practice-session-immersive-frame"
import { readDiagnosticIntent } from "@/lib/auth/diagnostic-intent"

type GuestDiagnosticReviewPageProps = {
  mode: GuestDiagnosticExamMode
  preview?: boolean
}

function answersFromResultOutcomes(
  outcomes: { questionId: string; isCorrect: boolean; selectedAnswer?: string | null }[],
): Record<string, GuestDiagnosticAnswerState> {
  const answers: Record<string, GuestDiagnosticAnswerState> = {}
  for (const outcome of outcomes) {
    const selected = outcome.selectedAnswer?.trim()
    if (!selected) continue
    answers[outcome.questionId] = {
      selectedAnswer: selected,
      isCorrect: outcome.isCorrect,
    }
  }
  return answers
}

function GuestDiagnosticReviewPage({ mode, preview = false }: GuestDiagnosticReviewPageProps) {
  const navigate = useNavigate()
  const { hasActiveCore } = useDiagnosticSubscription()

  const result = useMemo(() => {
    const stored = readGuestDiagnosticResult()
    if (stored) return stored
    if (preview) {
      const intentRaw = readDiagnosticIntent()
      const intentId = isGuestDiagnosticIntentId(intentRaw) ? intentRaw : "mini"
      return buildDefaultGuestDiagnosticResult(intentId)
    }
    return null
  }, [preview])

  useEffect(() => {
    document.documentElement.classList.add("student-shell-immersive")
    return () => {
      document.documentElement.classList.remove("student-shell-immersive")
    }
  }, [])

  if (!result) {
    return <Navigate to="/intent" replace />
  }

  const config = getGuestDiagnosticTestConfig(result.intentId)
  const initialAnswers = mode === "review" ? answersFromResultOutcomes(result.outcomes) : {}
  const resultsHref = preview
    ? "/diagnostic/results/preview"
    : diagnosticAttemptHref(result.intentId, result.id)
  const resultsReturnHref = `${resultsHref}${resultsHref.includes("?") ? "&" : "?"}from=review`
  // Preview routes treat the viewer as free so teaser limits are visible in demos.
  const explanationsUnlocked = preview ? false : hasActiveCore

  return (
    <PracticeSessionImmersiveFrame hideScrim className="z-30">
      <GuestDiagnosticExamLayout
        config={config}
        mode={mode}
        interactive={false}
        initialAnswers={initialAnswers}
        hasActiveCore={explanationsUnlocked}
        onExitReview={() => navigate(resultsReturnHref)}
      />
    </PracticeSessionImmersiveFrame>
  )
}

export { GuestDiagnosticReviewPage }
