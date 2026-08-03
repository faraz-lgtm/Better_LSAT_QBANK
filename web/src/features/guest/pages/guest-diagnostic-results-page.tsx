import { useMemo } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

import {
  buildDefaultGuestDiagnosticResult,
  readGuestDiagnosticResult,
} from '@/features/guest/diagnostic/guest-diagnostic-result-storage'
import { GuestDiagnosticResultsView } from '@/features/guest/diagnostic/guest-diagnostic-results-view'
import { isGuestDiagnosticIntentId } from '@/features/guest/diagnostic/guest-diagnostic-test-config'
import { useDiagnosticSubscription } from '@/features/guest/diagnostic/use-diagnostic-subscription'
import { readDiagnosticIntent } from '@/lib/auth/diagnostic-intent'

type GuestDiagnosticResultsPageProps = {
  preview?: boolean
}

function GuestDiagnosticResultsPage({ preview = false }: GuestDiagnosticResultsPageProps) {
  const [searchParams] = useSearchParams()
  const { refresh } = useDiagnosticSubscription()
  const checkoutSuccess = searchParams.get('checkout') === 'success'

  const result = useMemo(() => {
    const stored = readGuestDiagnosticResult()
    if (stored) return stored

    if (preview) {
      const intentRaw = readDiagnosticIntent()
      const intentId = isGuestDiagnosticIntentId(intentRaw) ? intentRaw : 'mini'
      return buildDefaultGuestDiagnosticResult(intentId)
    }

    return null
  }, [preview])

  if (!result) {
    return <Navigate to="/intent" replace />
  }

  return (
    <GuestDiagnosticResultsView
      result={result}
      startDiagnosticHref={preview ? '/diagnostic/start/preview?intent=mini' : '/diagnostic/start'}
      refreshSubscription={checkoutSuccess ? refresh : undefined}
    />
  )
}

export { GuestDiagnosticResultsPage }
