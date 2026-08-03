import type { ReactNode } from "react"

import { AuthSidebar } from "@/features/auth/components/auth-sidebar"
import { AuthSplitFooter } from "@/features/auth/components/auth-split-footer"
import { AuthSplitHeader } from "@/features/auth/components/auth-split-header"
import { cn } from "@/lib/utils"

type AuthLayoutProps = {
  children: ReactNode
  ctaLabel?: string
  ctaHref?: "/login" | "/signup"
  ctaPrompt?: string
  headerVariant?: "auth" | "app" | "intent"
  /** Wide scrollable main area for multi-column flows (e.g. pricing). */
  contentLayout?: "default" | "wide" | "lsac-link" | "intent"
  /** Hide marketing sidebar so main content uses full width (e.g. intent picker). */
  hideSidebar?: boolean
  /** Hide intent header sign-in prompt when user is already authenticated. */
  hideIntentSignIn?: boolean
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
  hideSidebar = false,
  hideIntentSignIn = false,
}: AuthLayoutProps) {
  const prompt = ctaPrompt ?? (ctaHref ? getDefaultCtaPrompt(ctaHref) : undefined)
  const showFooter = headerVariant === "auth" || headerVariant === "intent"

  const mainClass =
    contentLayout === "wide"
      ? "auth-split-main auth-split-main--wide"
      : contentLayout === "lsac-link"
        ? "auth-split-main auth-split-main--lsac-link"
        : contentLayout === "intent"
          ? "auth-split-main auth-split-main--intent"
          : "auth-split-main"

  const shellClass =
    contentLayout === "wide"
      ? "auth-content-shell auth-content-shell--wide"
      : contentLayout === "lsac-link"
        ? "auth-content-shell auth-content-shell--lsac-link"
        : contentLayout === "intent"
          ? "auth-content-shell auth-content-shell--intent"
          : "auth-content-shell"

  const pageClass = hideSidebar ? "auth-page auth-split-page auth-split-page--intent-only" : "auth-page auth-split-page"
  const frameClass = hideSidebar ? "auth-split-frame auth-split-frame--no-sidebar" : "auth-split-frame"

  return (
    <div className={pageClass}>
      <div className={frameClass}>
        {hideSidebar ? null : <AuthSidebar />}
        <div className={cn("auth-split-content", hideSidebar && "auth-split-content--full")}>
          <div className="auth-split-pattern" aria-hidden />
          <AuthSplitHeader
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            ctaPrompt={prompt}
            variant={headerVariant}
            hideIntentSignIn={hideIntentSignIn}
          />
          <main className={mainClass}>
            <div className={shellClass}>{children}</div>
          </main>
          {showFooter ? <AuthSplitFooter /> : null}
        </div>
      </div>
    </div>
  )
}

export { AuthLayout }
