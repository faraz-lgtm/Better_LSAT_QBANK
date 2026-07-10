import type { ReactNode } from "react"

import { GuestMarketingPanelLayout } from "@/features/guest/marketing/guest-marketing-panel-layout"

type GuestDiagnosticIntentLayoutProps = {
  children: ReactNode
}

function GuestDiagnosticIntentLayout({ children }: GuestDiagnosticIntentLayoutProps) {
  return <GuestMarketingPanelLayout headerVariant="intent">{children}</GuestMarketingPanelLayout>
}

export { GuestDiagnosticIntentLayout }
