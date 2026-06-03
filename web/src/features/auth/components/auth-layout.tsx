import { type CSSProperties, type ReactNode } from "react"

import { AuthHeader } from "@/features/auth/components/auth-header"
import authBackgroundImage from "@/assets/Group 1686550898.png"

type AuthLayoutProps = {
  children: ReactNode
  ctaLabel: string
  ctaHref: "/login" | "/signup"
  headerVariant?: "auth" | "app"
}

function AuthLayout({ children, ctaLabel, ctaHref, headerVariant = "auth" }: AuthLayoutProps) {
  return (
    <div className="auth-page flex min-h-svh flex-col bg-[#f5f9ff]">
      <AuthHeader ctaLabel={ctaLabel} ctaHref={ctaHref} variant={headerVariant} />
      <main className="auth-main-wrap relative flex-1 overflow-x-hidden overflow-y-auto bg-[#f5f9ff]">
        <div className="auth-desktop-canvas mx-auto">
          <div
            className="auth-main relative flex min-h-[calc(100svh-72px)] w-full items-center justify-center py-8"
            style={{ "--auth-bg-image": `url(${authBackgroundImage})` } as CSSProperties}
          >
            <div className="auth-content-shell relative z-10 w-full">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export { AuthLayout }
