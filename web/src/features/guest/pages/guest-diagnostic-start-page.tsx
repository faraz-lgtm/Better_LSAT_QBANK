import { useEffect, useMemo, useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"

import { GuestDiagnosticExamLayout } from "@/features/guest/diagnostic/guest-diagnostic-exam-layout"
import { clearDiagnosticFunnel, readDiagnosticIntent } from "@/lib/auth/diagnostic-intent"
import { GuestDiagnosticTestInstructionsPanel } from "@/features/guest/diagnostic/guest-diagnostic-test-instructions-panel"
import {
  getGuestDiagnosticTestConfig,
  isGuestDiagnosticIntentId,
} from "@/features/guest/diagnostic/guest-diagnostic-test-config"
import { createGuestDiagnosticPreviewQuestions } from "@/features/guest/diagnostic/guest-diagnostic-exam-mock-data"
import {
  buildGuestDiagnosticResultFromAnswers,
  writeGuestDiagnosticResult,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import { GUEST_FREE_PLAN_RESULTS_HREF } from "@/features/guest/diagnostic/guest-free-plan-nav-config"
import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import { PracticeSessionImmersiveFrame } from "@/features/student/practice-session/practice-session-immersive-frame"

type GuestDiagnosticStartPageProps = {
  preview?: boolean
}

function resolveDiagnosticIntent(
  preview: boolean,
  searchParams: URLSearchParams,
): GuestDiagnosticIntentId | null {
  const queryIntent = searchParams.get("intent")
  if (isGuestDiagnosticIntentId(queryIntent)) return queryIntent

  if (preview) return "mini"

  const storedIntent = readDiagnosticIntent()
  if (isGuestDiagnosticIntentId(storedIntent)) return storedIntent

  return null
}

function GuestDiagnosticStartPage({ preview = false }: GuestDiagnosticStartPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showInstructions, setShowInstructions] = useState(true)

  const intentId = useMemo(
    () => resolveDiagnosticIntent(preview, searchParams),
    [preview, searchParams],
  )

  useEffect(() => {
    document.documentElement.classList.add("student-shell-immersive")
    return () => {
      document.documentElement.classList.remove("student-shell-immersive")
    }
  }, [])

  if (!intentId) {
    return <Navigate to="/intent" replace />
  }

  const resolvedIntentId = intentId
  const config = getGuestDiagnosticTestConfig(resolvedIntentId)

  function handleGoToQuestions() {
    setShowInstructions(false)
  }

  function handleSubmitted(answersByQuestion: Record<string, { selectedAnswer: string; isCorrect: boolean }>) {
    const questions = createGuestDiagnosticPreviewQuestions(config.questionCount)
    const result = buildGuestDiagnosticResultFromAnswers(resolvedIntentId, questions, answersByQuestion)
    writeGuestDiagnosticResult(result)
    clearDiagnosticFunnel()
    navigate(preview ? "/diagnostic/results/preview" : GUEST_FREE_PLAN_RESULTS_HREF, { replace: true })
  }

  return (
    <>
      <PracticeSessionImmersiveFrame hideScrim className="z-30">
        <GuestDiagnosticExamLayout
          config={config}
          interactive={!showInstructions}
          onSubmitted={handleSubmitted}
        />
      </PracticeSessionImmersiveFrame>

      {showInstructions ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px] md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={config.title}
        >
          <GuestDiagnosticTestInstructionsPanel config={config} onGoToQuestions={handleGoToQuestions} />
        </div>
      ) : null}
    </>
  )
}

export { GuestDiagnosticStartPage }
