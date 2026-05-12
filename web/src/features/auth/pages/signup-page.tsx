import { Link, useNavigate } from "react-router-dom"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { SocialButton } from "@/components/ui/social-button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { createAuthApi, getAuthCallbackUrl } from "@/lib/api/auth"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function Divider() {
  return (
    <div className="figma-gap-12 flex items-center">
      <div className="h-px flex-1 bg-[#dfe1e7]" />
      <span className="figma-text-lg figma-track-md font-semibold text-[#666d80]">
        OR
      </span>
      <div className="h-px flex-1 bg-[#dfe1e7]" />
    </div>
  )
}

type TermsCheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
}

function TermsCheckbox({ checked, onChange }: TermsCheckboxProps) {
  return (
    <label className="figma-gap-8 figma-text-sm figma-track-sm inline-flex items-center font-medium text-[#666d80]">
      <Checkbox
        size="sm"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        I agree to <span className="font-semibold text-[#0d47a1]">BetterLSAT&apos;s Terms of Service</span>{" "}
        <span className="text-[#df1c41]">*</span>
      </span>
    </label>
  )
}

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
      setError(authError instanceof Error ? authError.message : "Unable to send magic link.")
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
      setError(authError instanceof Error ? authError.message : "Unable to continue with Google.")
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout ctaLabel="Log In" ctaHref="/login">
      <AuthCard className="mx-auto w-full">
        <div className="figma-gap-24 flex flex-col">
          <h1 className="figma-track-md text-center">Create an account</h1>

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
              className="rounded-2xl bg-[#f5f9ff]"
            />
          </div>

          <TermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms} />

          <Button
            type="button"
            disabled={isSubmitting || !email.trim()}
            onClick={() => void sendMagicLink()}
            className="w-full rounded-2xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90"
          >
            {isSubmitting ? "Sending..." : "Send magic link"}
          </Button>

          {error && <p className="figma-text-sm figma-track-sm text-center text-[#df1c41]">{error}</p>}

          <Divider />

          <SocialButton
            className="w-full justify-center rounded-2xl bg-[#f5f9ff]"
            onClick={() => void continueWithGoogle()}
            disabled={isSubmitting}
          >
            Sign up with Google
          </SocialButton>

          <p className="figma-text-sm figma-track-sm text-center text-[#666d80]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#0d47a1]">
              Log in
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export { SignupPage }
