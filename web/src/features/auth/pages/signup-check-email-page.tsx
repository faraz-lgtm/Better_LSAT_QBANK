import { useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"

import { AuthCard } from "@/features/auth/components/auth-card"
import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import { GuestMarketingPanelLayout } from "@/features/guest/marketing/guest-marketing-panel-layout"
import { createAuthApi, getAuthCallbackUrl } from "@/lib/api/auth"
import { saveDiagnosticIntent, markDiagnosticFunnelActive } from "@/lib/auth/diagnostic-intent"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

type SignupCheckEmailLocationState = {
  email?: string
  from?: "intent"
  intent?: GuestDiagnosticIntentId
}

function SignupCheckEmailPage() {
  const location = useLocation()
  const locationState = (location.state ?? null) as SignupCheckEmailLocationState | null
  const email = locationState?.email?.trim() ?? ""
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const authApi = useMemo(() => {
    try {
      return createAuthApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  async function handleResend() {
    if (!email) {
      return
    }
    if (!authApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }

    if (locationState?.from === "intent" && locationState.intent) {
      markDiagnosticFunnelActive()
      saveDiagnosticIntent(locationState.intent)
    }

    setIsResending(true)
    setError(null)
    setResendMessage(null)
    try {
      await authApi.sendMagicLink(email, getAuthCallbackUrl())
      setResendMessage("We sent another login link to your email.")
    } catch (resendError) {
      setError(resendError instanceof Error ? formatSupabaseCallError(resendError) : "Unable to resend email.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <GuestMarketingPanelLayout headerVariant="signup">
      <AuthCard className="guest-marketing-signup-card">
        <div className="figma-gap-24 flex w-full flex-col items-center text-center">
          <h1 className="text-2xl font-bold leading-[1.3] text-[#062357]">Check your email</h1>

          <div className="figma-gap-16 flex w-full max-w-[436px] flex-col items-center">
            <p className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#062357]">
              We just sent you a login link!
            </p>
            <p className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#062357]">
              If you don&apos;t see our email, check your spam for a message from{" "}
              <span className="font-semibold text-[#0d47a1]">email@betterlsat.com</span>
            </p>

            {email ? (
              <button
                type="button"
                className="guest-marketing-check-email-resend"
                disabled={isResending}
                onClick={() => void handleResend()}
              >
                {isResending ? "Sending..." : "Resend Email"}
              </button>
            ) : (
              <Link to="/signup" className="guest-marketing-check-email-resend">
                Resend Email
              </Link>
            )}
          </div>

          {resendMessage ? (
            <p className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#0d47a1]">{resendMessage}</p>
          ) : null}
          {error ? <p className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#df1c41]">{error}</p> : null}

          <div className="figma-gap-12 flex w-full max-w-[436px] items-center">
            <div className="h-px flex-1 bg-[#dfe1e7]" />
            <span className="text-lg font-semibold leading-[1.4] tracking-[0.36px] text-[#666d80]">OR</span>
            <div className="h-px flex-1 bg-[#dfe1e7]" />
          </div>

          <Link to="/login" className="guest-marketing-check-email-alt">
            Try another way
          </Link>
        </div>
      </AuthCard>
    </GuestMarketingPanelLayout>
  )
}

export { SignupCheckEmailPage }
