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
}: AuthLayoutProps) {
  const prompt = ctaPrompt ?? getDefaultCtaPrompt(ctaHref)

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
          <main className="auth-split-main">
            <div className="auth-content-shell">{children}</div>
          </main>
          {headerVariant === "auth" ? <AuthSplitFooter /> : null}
        </div>
      </div>
    </div>
  )
}

export { AuthLayout }
