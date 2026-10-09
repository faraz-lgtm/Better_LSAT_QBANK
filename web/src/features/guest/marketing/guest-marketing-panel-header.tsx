import { Link } from "react-router-dom"

import {
  GUEST_INTENT_HEADER_CLASS,
  GUEST_INTENT_UPGRADE_BUTTON_CLASS,
} from "@/features/guest/diagnostic/guest-diagnostic-intent-styles"

type GuestMarketingPanelHeaderProps = {
  variant: "intent" | "signup" | "login"
}

function GuestMarketingPanelHeader({ variant }: GuestMarketingPanelHeaderProps) {
  const logoHref = variant === "intent" ? "/intent" : variant === "login" ? "/login" : "/signup"

  return (
    <header className={GUEST_INTENT_HEADER_CLASS}>
      <Link to={logoHref} className="flex shrink-0 items-center" aria-label="betterLSAT home">
        <img src="/betterLSAT_LOGO.png" alt="betterLSAT" className="auth-split-logo" />
      </Link>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
        {variant === "intent" ? (
          <button type="button" className={GUEST_INTENT_UPGRADE_BUTTON_CLASS}>
            Upgrade now
          </button>
        ) : null}
        <p className="m-0 text-base leading-6 tracking-[0.32px] text-[#666d80]">
          {variant === "signup" ? (
            <>
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[#0d47a1]">
                Sign In
              </Link>
            </>
          ) : variant === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="font-semibold text-[#0d47a1]">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <Link to="/login" className="font-semibold text-[#0d47a1]">
                Sign In
              </Link>
            </>
          )}
        </p>
      </div>
    </header>
  )
}

export { GuestMarketingPanelHeader }
