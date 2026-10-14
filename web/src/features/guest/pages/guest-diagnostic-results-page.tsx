import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'

import { useStudentEntitlementOptional } from '@/features/app-shell/student-entitlement-context'
import {
  pollEntitlementAfterCheckoutSuccess,
} from '@/features/app-shell/poll-entitlement-after-checkout'
import { CheckoutPaymentSuccessDialog } from '@/features/billing/components/checkout-payment-success-dialog'
import {
  buildDefaultGuestDiagnosticResult,
  getDiagnosticAttempt,
  readGuestDiagnosticResult,
  writeGuestDiagnosticResult,
} from '@/features/guest/diagnostic/guest-diagnostic-result-storage'
import { GuestDiagnosticResultsView } from '@/features/guest/diagnostic/guest-diagnostic-results-view'
import { isGuestDiagnosticIntentId } from '@/features/guest/diagnostic/guest-diagnostic-test-config'
import { useDiagnosticSubscription } from '@/features/guest/diagnostic/use-diagnostic-subscription'
import { useTrackCheckoutPurchase } from '@/lib/analytics/track-checkout-purchase'
import { createUsersApi } from '@/lib/api/users'
import { readDiagnosticIntent } from '@/lib/auth/diagnostic-intent'
import {
  CalculatingScoreLoader,
  useCalculatingScoreReveal,
} from '@/features/student/components/calculating-score-loader'
import { StudentMain } from '@/features/student/components/student-main'
import {
  diagnosticAttemptHref,
  diagnosticHistoryHref,
  diagnosticResultsSectionFromIntent,
  type DiagnosticResultsSection,
} from '@/features/student/diagnostic/diagnostic-results-routes'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

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
  useTrackCheckoutPurchase()
  const { refresh } = useDiagnosticSubscription()
  const entitlementCtx = useStudentEntitlementOptional()
  const [unlockAfterCheckout] = useState(
    () =>
      searchParams.get('checkout') === 'success' || searchParams.get('payment') === 'success',
  )
  const returningFromReview =
    searchParams.get('from') === 'review' || searchParams.get('from') === 'tester'

  useEffect(() => {
    if (!unlockAfterCheckout) return

    const controller = new AbortController()
    const usersApi = createUsersApi(getSupabaseBrowserClient())
    const pollParams = new URLSearchParams('checkout=success')

    void pollEntitlementAfterCheckoutSuccess(pollParams, {
      getEntitlement: () => usersApi.getEntitlementState(),
      refresh: async () => {
        const next = entitlementCtx ? await entitlementCtx.refresh() : null
        refresh()
        return next
      },
      currentEntitlement: entitlementCtx?.entitlement ?? null,
      signal: controller.signal,
    })
      .then((synced) => {
        if (!synced) refresh()
      })
      .catch(() => {
        refresh()
      })

    return () => {
      controller.abort()
    }
    // Unlock once per return from Stripe; do not restart when dialog clears query params.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-once unlock
  }, [unlockAfterCheckout])

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
        className="min-h-full bg-[var(--primary-0)]"
        contentClassName="flex min-h-0 flex-1 flex-col bg-[var(--primary-0)]"
      >
        <CalculatingScoreLoader className="min-h-0 flex-1" />
      </StudentMain>
    )
  }

  return (
    <>
      <CheckoutPaymentSuccessDialog confirmLabel="View results" />
      <GuestDiagnosticResultsView
        result={result}
        reviewInTesterHref={preview ? '/diagnostic/review/preview' : '/diagnostic/review'}
        refreshSubscription={unlockAfterCheckout ? refresh : undefined}
      />
    </>
  )
}

export { GuestDiagnosticResultsPage }
