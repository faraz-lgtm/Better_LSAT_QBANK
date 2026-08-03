import { GuestFreeDashboardShell } from '@/features/guest/diagnostic/guest-free-dashboard-shell'
import { GuestDiagnosticResultsPage } from '@/features/guest/pages/guest-diagnostic-results-page'

function GuestDiagnosticResultsPreviewPage() {
  return (
    <GuestFreeDashboardShell dashboardHref="/diagnostic/results/preview">
      <GuestDiagnosticResultsPage preview />
    </GuestFreeDashboardShell>
  )
}

export { GuestDiagnosticResultsPreviewPage }
