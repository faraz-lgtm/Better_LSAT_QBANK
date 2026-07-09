import { useSearchParams } from "react-router-dom"

import { GuestFreeDashboardShell } from "@/features/guest/diagnostic/guest-free-dashboard-shell"
import { GuestPremiumPreviewShell } from "@/features/guest/diagnostic/guest-premium-preview-shell"
import { GuestDiagnosticResultsPage } from "@/features/guest/pages/guest-diagnostic-results-page"

function GuestDiagnosticResultsPreviewPage() {
  const [searchParams] = useSearchParams()
  const premium = searchParams.get("premium") === "1"

  if (premium) {
    return (
      <GuestPremiumPreviewShell>
        <GuestDiagnosticResultsPage preview />
      </GuestPremiumPreviewShell>
    )
  }

  return (
    <GuestFreeDashboardShell dashboardHref="/diagnostic/results/preview">
      <GuestDiagnosticResultsPage preview />
    </GuestFreeDashboardShell>
  )
}

export { GuestDiagnosticResultsPreviewPage }
