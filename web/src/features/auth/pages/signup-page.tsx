import { useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SocialButton } from "@/components/ui/social-button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthTermsCheckbox } from "@/features/auth/components/auth-terms-checkbox"
import { GUEST_DIAGNOSTIC_INTENT_STORAGE_KEY } from "@/features/guest/diagnostic/guest-diagnostic-intent-data"
import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import { GuestMarketingPanelLayout } from "@/features/guest/marketing/guest-marketing-panel-layout"
import { createAuthApi, getAuthCallbackUrl } from "@/lib/api/auth"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

type SignupLocationState = {
  from?: "intent"
  intent?: GuestDiagnosticIntentId
}

function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = (location.state ?? null) as SignupLocationState | null
  const [email, setEmail] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const submitLockRef = useRef(false)

  const authApi = useMemo(() => {
    try {
      return createAuthApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  function persistDiagnosticIntent() {
    if (locationState?.from !== "intent") return
    if (locationState.intent) {
      sessionStorage.setItem(GUEST_DIAGNOSTIC_INTENT_STORAGE_KEY, locationState.intent)
    }
  }

  async function withSubmitLock(task: () => Promise<void>): Promise<boolean> {
    if (submitLockRef.current) return false
    submitLockRef.current = true
    setIsSubmitting(true)
    try {
      await task()
      return true
    } finally {
      submitLockRef.current = false
      setIsSubmitting(false)
    }
  }

  async function sendMagicLink() {
    if (!authApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    if (!acceptedTerms) {
      setError("You must accept the Terms of Service before continuing.")
      return
    }

    setError(null)
    try {
      const sent = await withSubmitLock(async () => {
        persistDiagnosticIntent()
        await authApi.sendMagicLink(email.trim(), getAuthCallbackUrl())
        navigate("/signup/check-email", {
          replace: true,
          state: { email: email.trim(), from: locationState?.from, intent: locationState?.intent },
        })
      })
      if (!sent) return
    } catch (authError) {
      setError(authError instanceof Error ? formatSupabaseCallError(authError) : "Unable to send magic link.")
    }
  }

  async function continueWithGoogle() {
    if (!authApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    if (!acceptedTerms) {
      setError("You must accept the Terms of Service before continuing.")
      return
    }
    if (googleLoading || isSubmitting || submitLockRef.current) return

    setGoogleLoading(true)
    setError(null)
    try {
      persistDiagnosticIntent()
      await authApi.signInWithGoogle(getAuthCallbackUrl())
    } catch (authError) {
      setError(authError instanceof Error ? formatSupabaseCallError(authError) : "Unable to continue with Google.")
      setGoogleLoading(false)
    }
  }

  const isBusy = isSubmitting || googleLoading

  return (
    <GuestMarketingPanelLayout headerVariant="signup">
      <AuthCard className="guest-marketing-signup-card">
        <div className="figma-gap-24 flex flex-col">
          <h1 className="figma-track-md text-center text-2xl font-bold leading-[1.3] text-[#062357]">
            Create an account
          </h1>

          <div className="figma-gap-16 flex flex-col">
            <div className="figma-gap-8 flex flex-col">
              <p className="figma-text-sm figma-track-sm font-medium text-[#062357]">
                Email for Magic Link<span className="text-[#df1c41]">*</span>
              </p>
              <Input
                size="lg"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                disabled={isBusy}
              />
            </div>

            <AuthTermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms} disabled={isBusy} />
          </div>

          <Button
            type="button"
            disabled={isBusy || !email.trim()}
            aria-busy={isSubmitting}
            onClick={() => void sendMagicLink()}
            className="ds-btn w-full gap-2"
          >
            {isSubmitting ? (
              <>
                <span
                  className="size-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
                Sending...
              </>
            ) : (
              "Send Confirmation Link"
            )}
          </Button>

          {error ? <p className="figma-text-sm figma-track-sm text-center text-[#df1c41]">{error}</p> : null}

          <div className="figma-gap-12 flex items-center">
            <div className="h-px flex-1 bg-[#dfe1e7]" />
            <span className="figma-text-lg figma-track-md font-semibold text-[#666d80]">OR</span>
            <div className="h-px flex-1 bg-[#dfe1e7]" />
          </div>

          <div className="figma-gap-16 flex flex-col">
            <AuthTermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms} disabled={isBusy} />

            <SocialButton
              onClick={() => void continueWithGoogle()}
              disabled={isBusy}
              aria-busy={googleLoading}
              className="auth-social-btn gap-2"
            >
              {googleLoading ? (
                <>
                  <span
                    className="size-4 shrink-0 animate-spin rounded-full border-2 border-[#dfe1e7] border-t-[#0d47a1]"
                    aria-hidden
                  />
                  Redirecting...
                </>
              ) : (
                "Sign in with Google"
              )}
            </SocialButton>
          </div>
        </div>
      </AuthCard>
    </GuestMarketingPanelLayout>
  )
}

export { SignupPage }
