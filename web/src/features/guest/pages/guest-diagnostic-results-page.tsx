import { useEffect, useMemo } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'

import {
  buildDefaultGuestDiagnosticResult,
  getDiagnosticAttempt,
  readGuestDiagnosticResult,
  writeGuestDiagnosticResult,
} from '@/features/guest/diagnostic/guest-diagnostic-result-storage'
import { GuestDiagnosticResultsView } from '@/features/guest/diagnostic/guest-diagnostic-results-view'
import { isGuestDiagnosticIntentId } from '@/features/guest/diagnostic/guest-diagnostic-test-config'
import { useDiagnosticSubscription } from '@/features/guest/diagnostic/use-diagnostic-subscription'
import { readDiagnosticIntent } from '@/lib/auth/diagnostic-intent'
import {
  CalculatingScoreLoader,
  useCalculatingScoreReveal,
} from '@/features/student/components/calculating-score-loader'
import { StudentMain } from '@/features/student/components/student-main'
import { PT_RESULTS_PAGE_BG_CLASS } from '@/features/student/analytics/prep-test-results-section-styles'
import {
  diagnosticAttemptHref,
  diagnosticHistoryHref,
  diagnosticResultsSectionFromIntent,
  type DiagnosticResultsSection,
} from '@/features/student/diagnostic/diagnostic-results-routes'
import { cn } from '@/lib/utils'

type GuestDiagnosticResultsPageProps = {
  preview?: boolean
  section?: DiagnosticResultsSection
}

const RESULTS_SEEN_STORAGE_PREFIX = 'guestDiagnosticResultsSeen:'

function resultsSeenStorageKey(intentId: string, completedAt: string): string {
  return `${RESULTS_SEEN_STORAGE_PREFIX}${intentId}:${completedAt}`
}

function hasSeenDiagnosticResults(intentId: string, completedAt: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(resultsSeenStorageKey(intentId, completedAt)) === '1'
  } catch {
    return false
  }
}

function markDiagnosticResultsSeen(intentId: string, completedAt: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(resultsSeenStorageKey(intentId, completedAt), '1')
  } catch {
    // Ignore quota / private-mode failures — loader still works without persistence.
  }
}

function GuestDiagnosticResultsPage({ preview = false, section }: GuestDiagnosticResultsPageProps) {
  const { attemptId } = useParams<{ attemptId: string }>()
  const [searchParams] = useSearchParams()
  const { refresh } = useDiagnosticSubscription()
  const checkoutSuccess = searchParams.get('checkout') === 'success'
  const returningFromReview =
    searchParams.get('from') === 'review' || searchParams.get('from') === 'tester'

  const result = useMemo(() => {
    if (attemptId) {
      return getDiagnosticAttempt(attemptId)
    }

    const stored = readGuestDiagnosticResult()
    if (stored) return stored

    if (preview) {
      const intentRaw = readDiagnosticIntent()
      const intentId = isGuestDiagnosticIntentId(intentRaw) ? intentRaw : 'mini'
      return buildDefaultGuestDiagnosticResult(intentId)
    }

    return null
  }, [attemptId, preview])

  useEffect(() => {
    if (!result || preview) return
    writeGuestDiagnosticResult(result)
  }, [preview, result])

  const skipScoreLoader =
    returningFromReview ||
    (result != null && hasSeenDiagnosticResults(result.intentId, result.completedAt))

  const revealResults = useCalculatingScoreReveal({
    dataReady: result != null,
    resetKey: result ? `${result.intentId}:${result.completedAt}` : 'missing',
    minMs: skipScoreLoader ? 0 : undefined,
  })

  useEffect(() => {
    if (!result || !revealResults) return
    markDiagnosticResultsSeen(result.intentId, result.completedAt)
  }, [result, revealResults])

  if (attemptId && !result) {
    return <Navigate to={diagnosticHistoryHref(section ?? 'mini')} replace />
  }

  if (!result) {
    return <Navigate to={section ? diagnosticHistoryHref(section) : '/intent'} replace />
  }

  if (section && diagnosticResultsSectionFromIntent(result.intentId) !== section) {
    return <Navigate to={diagnosticAttemptHref(result.intentId, result.id)} replace />
  }

  if (!revealResults) {
    return (
      <StudentMain
        className={cn('min-h-full', PT_RESULTS_PAGE_BG_CLASS)}
        contentClassName={cn('flex min-h-0 flex-1 flex-col', PT_RESULTS_PAGE_BG_CLASS)}
      >
        <CalculatingScoreLoader className="min-h-0 flex-1" />
      </StudentMain>
    )
  }

  const startIntent = result.intentId === 'mini' ? 'mini' : 'quick'

  return (
    <GuestDiagnosticResultsView
      result={result}
      startDiagnosticHref={preview ? '/diagnostic/start/preview?intent=mini' : `/diagnostic/start?intent=${startIntent}`}
      reviewInTesterHref={preview ? '/diagnostic/review/preview' : '/diagnostic/review'}
      refreshSubscription={checkoutSuccess ? refresh : undefined}
    />
  )
}

export { GuestDiagnosticResultsPage }
