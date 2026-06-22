import { useNavigate } from "react-router-dom"
import { useMemo, useState } from "react"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authApi = useMemo(() => {
    try {
      return createAuthApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  async function sendMagicLink() {
    if (!authApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    if (!acceptedTerms) {
      setError("You must accept the Terms of Service before continuing.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await authApi.sendMagicLink(email.trim(), getAuthCallbackUrl())
      navigate("/signup/check-email", { replace: true, state: { email: email.trim() } })
    } catch (authError) {
      setError(authError instanceof Error ? formatSupabaseCallError(authError) : "Unable to send magic link.")
    } finally {
      setIsSubmitting(false)
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

    setIsSubmitting(true)
    setError(null)
    try {
      await authApi.signInWithGoogle(getAuthCallbackUrl())
    } catch (authError) {
      setError(authError instanceof Error ? formatSupabaseCallError(authError) : "Unable to continue with Google.")
      setIsSubmitting(false)
    }
  }

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
              />
            </div>

            <AuthTermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms} />
          </div>

          <Button
            type="button"
            disabled={isSubmitting || !email.trim()}
            onClick={() => void sendMagicLink()}
            className="ds-btn w-full"
          >
            {isSubmitting ? "Sending..." : "Send Confirmation Link"}
          </Button>

          {error && <p className="figma-text-sm figma-track-sm text-center text-[#df1c41]">{error}</p>}

          <div className="figma-gap-12 flex items-center">
            <div className="h-px flex-1 bg-[#dfe1e7]" />
            <span className="figma-text-lg figma-track-md font-semibold text-[#666d80]">OR</span>
            <div className="h-px flex-1 bg-[#dfe1e7]" />
          </div>

          <div className="figma-gap-16 flex flex-col">
            <AuthTermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms} />

            <SocialButton onClick={() => void continueWithGoogle()} disabled={isSubmitting} className="auth-social-btn">
              Sign in with Google
            </SocialButton>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export { SignupPage }
