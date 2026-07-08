import { useMemo } from "react"
import { Navigate, useSearchParams } from "react-router-dom"

import {
  buildDefaultGuestDiagnosticResult,
  readGuestDiagnosticResult,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import { GuestDiagnosticResultsView } from "@/features/guest/diagnostic/guest-diagnostic-results-view"
import { isGuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-test-config"
import { readDiagnosticIntent } from "@/lib/auth/diagnostic-intent"
import { useGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"

type GuestDiagnosticResultsPageProps = {
  preview?: boolean
}

function GuestDiagnosticResultsPage({ preview = false }: GuestDiagnosticResultsPageProps) {
  const [searchParams] = useSearchParams()
  const premiumAccount = useGuestPremiumAccount()
  const previewPremium = preview && searchParams.get("premium") === "1"

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

  if (!result) {
    return <Navigate to="/intent" replace />
  }

  const variant = premiumAccount || previewPremium ? "premium" : "free"

  return (
    <GuestDiagnosticResultsView
      key={premiumAccount?.activatedAt ?? (previewPremium ? "preview-premium" : "free")}
      result={result}
      variant={variant}
      startDiagnosticHref={preview ? "/diagnostic/start/preview?intent=mini" : "/diagnostic/start"}
      usePreviewModal={preview}
    />
  )
}

export { GuestDiagnosticResultsPage }
