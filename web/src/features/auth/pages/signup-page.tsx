import { useNavigate } from "react-router-dom"
import { useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SocialButton } from "@/components/ui/social-button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { AuthTermsCheckbox } from "@/features/auth/components/auth-terms-checkbox"
import { createAuthApi, getAuthCallbackUrl } from "@/lib/api/auth"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

function SignupPage() {
  const navigate = useNavigate()
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
        await authApi.sendMagicLink(email.trim(), getAuthCallbackUrl())
        navigate("/signup/check-email", { replace: true, state: { email: email.trim() } })
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
      await authApi.signInWithGoogle(getAuthCallbackUrl())
    } catch (authError) {
      setError(authError instanceof Error ? formatSupabaseCallError(authError) : "Unable to continue with Google.")
      setGoogleLoading(false)
    }
  }

  const isBusy = isSubmitting || googleLoading

  return (
    <AuthLayout ctaLabel="Sign In" ctaHref="/login">
      <AuthCard>
        <div className="figma-gap-24 flex flex-col">
          <h1 className="figma-track-md text-center">Create an account</h1>

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

          {error && <p className="figma-text-sm figma-track-sm text-center text-[#df1c41]">{error}</p>}

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
    </AuthLayout>
  )
}

export { SignupPage }
