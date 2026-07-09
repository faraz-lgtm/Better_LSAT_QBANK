import type { ReactNode } from "react"

import { AuthSidebar } from "@/features/auth/components/auth-sidebar"
import { AuthSplitFooter } from "@/features/auth/components/auth-split-footer"
import {
  GUEST_INTENT_MAIN_CLASS,
  GUEST_INTENT_PANEL_CLASS,
} from "@/features/guest/diagnostic/guest-diagnostic-intent-styles"
import { GuestMarketingPanelHeader } from "@/features/guest/marketing/guest-marketing-panel-header"
import { GuestMarketingPanelPattern } from "@/features/guest/marketing/guest-marketing-panel-pattern"

type GuestMarketingPanelLayoutProps = {
  children: ReactNode
  headerVariant: "intent" | "signup"
}

function GuestMarketingPanelLayout({ children, headerVariant }: GuestMarketingPanelLayoutProps) {
  return (
    <div className="auth-page auth-split-page guest-marketing-page">
      <div className="auth-split-frame">
        <AuthSidebar />
        <div className={GUEST_INTENT_PANEL_CLASS}>
          <GuestMarketingPanelPattern />
          <GuestMarketingPanelHeader variant={headerVariant} />
          <main className={GUEST_INTENT_MAIN_CLASS}>{children}</main>
          <AuthSplitFooter />
        </div>
      </div>
    </div>
  )
}

export { GuestMarketingPanelLayout }
