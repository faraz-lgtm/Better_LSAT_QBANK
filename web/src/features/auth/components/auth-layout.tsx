import type { ReactNode } from "react"

import { AuthSidebar } from "@/features/auth/components/auth-sidebar"
import { AuthSplitFooter } from "@/features/auth/components/auth-split-footer"
import { AuthSplitHeader } from "@/features/auth/components/auth-split-header"

type AuthLayoutProps = {
  children: ReactNode
  ctaLabel: string
  ctaHref: "/login" | "/signup"
  ctaPrompt?: string
  headerVariant?: "auth" | "app"
  /** Wide scrollable main area for multi-column flows (e.g. pricing). */
  contentLayout?: "default" | "wide" | "lsac-link"
}

function getDefaultCtaPrompt(ctaHref: "/login" | "/signup"): string {
  return ctaHref === "/login" ? "Already have an account?" : "Don't have an account?"
}

function AuthLayout({
  children,
  ctaLabel,
  ctaHref,
  ctaPrompt,
  headerVariant = "auth",
  contentLayout = "default",
}: AuthLayoutProps) {
  const prompt = ctaPrompt ?? getDefaultCtaPrompt(ctaHref)

  const mainClass =
    contentLayout === "wide"
      ? "auth-split-main auth-split-main--wide"
      : contentLayout === "lsac-link"
        ? "auth-split-main auth-split-main--lsac-link"
        : "auth-split-main"

  const shellClass =
    contentLayout === "wide"
      ? "auth-content-shell auth-content-shell--wide"
      : contentLayout === "lsac-link"
        ? "auth-content-shell auth-content-shell--lsac-link"
        : "auth-content-shell"

  return (
    <div className="auth-page auth-split-page">
      <div className="auth-split-frame">
        <AuthSidebar />
        <div className="auth-split-content">
          <div className="auth-split-pattern" aria-hidden />
          <AuthSplitHeader
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            ctaPrompt={prompt}
            variant={headerVariant}
          />
          <main className={mainClass}>
            <div className={shellClass}>{children}</div>
          </main>
          {headerVariant === "auth" ? <AuthSplitFooter /> : null}
        </div>
      </div>
    </div>
  )
}

export { AuthLayout }
