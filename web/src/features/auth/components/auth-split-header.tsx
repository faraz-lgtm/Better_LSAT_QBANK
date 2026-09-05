import { Link } from "react-router-dom"

import { FigmaIcon } from "@/components/icons/figma-icons"
import { Button } from "@/components/ui/button"

type AuthSplitHeaderProps = {
  ctaLabel?: string
  ctaHref?: "/login" | "/signup"
  ctaPrompt?: string
  variant?: "auth" | "app" | "intent"
  /** Hide intent header sign-in prompt (e.g. user already authenticated). */
  hideIntentSignIn?: boolean
}

function AuthSplitHeader({
  ctaLabel,
  ctaHref,
  ctaPrompt,
  variant = "auth",
  hideIntentSignIn = false,
}: AuthSplitHeaderProps) {
  if (variant === "intent") {
    return (
      <header className="auth-split-header auth-split-header--intent">
        <Link to="/intent" className="flex shrink-0 items-center" aria-label="betterLSAT home">
          <img src="/betterLSAT_LOGO.png" alt="betterLSAT" className="auth-split-logo" />
        </Link>
        <div className="auth-split-header-intent-actions">
          <Button asChild className="auth-split-header-intent-upgrade">
            <Link to="/signup">Upgrade · $99/mo</Link>
          </Button>
          {!hideIntentSignIn ? (
            <p className="auth-split-cta">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[var(--primary)]">
                Sign In
              </Link>
            </p>
          ) : null}
        </div>
      </header>
    )
  }

  if (variant === "app") {
    return (
      <header className="auth-split-header auth-split-header--app">
        <Link to="/login" className="flex shrink-0 items-center" aria-label="betterLSAT home">
          <img src="/betterLSAT_LOGO.png" alt="betterLSAT" className="auth-split-logo" />
        </Link>
        <div className="flex size-9 items-center justify-center rounded-full border border-[#dfe1e7] bg-white text-[#666d80]">
          <FigmaIcon name="user-circle" className="size-5 text-[#666d80]" />
        </div>
      </header>
    )
  }

  return (
    <header className="auth-split-header">
      <Link to="/login" className="flex shrink-0 items-center" aria-label="betterLSAT home">
        <img src="/betterLSAT_LOGO.png" alt="betterLSAT" className="auth-split-logo" />
      </Link>
      <p className="auth-split-cta">
        {ctaPrompt}{" "}
        <Link to={ctaHref!} className="font-semibold text-[#0d47a1]">
          {ctaLabel}
        </Link>
      </p>
    </header>
  )
}

export { AuthSplitHeader }
