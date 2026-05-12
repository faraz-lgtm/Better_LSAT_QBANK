import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { createAuthApi, getPasswordResetCallbackUrl } from "@/lib/api/auth"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const authApi = useMemo(() => {
    try {
      return createAuthApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  async function sendResetLink() {
    if (!authApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    setIsSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      await authApi.sendPasswordResetEmail(email.trim(), getPasswordResetCallbackUrl())
      setMessage("Reset link sent. Check your inbox to continue.")
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to send reset link.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout ctaLabel="Sign Up" ctaHref="/signup" headerVariant="auth">
      <AuthCard className="bg-[#f2f7ff]">
        <div className="figma-gap-24 flex flex-col">
          <div className="figma-gap-8 flex flex-col">
            <h1 className="figma-track-md text-center">Forgot your password?</h1>
            <p className="figma-text-sm figma-track-sm text-center text-[#666d80]">
              Enter the email associated with your account and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>

          <div className="figma-gap-8 flex flex-col">
            <p className="figma-text-sm figma-track-sm font-medium text-[#062357]">
              Email<span className="text-[#df1c41]">*</span>
            </p>
            <Input
              size="lg"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="rounded-2xl bg-[#f2f7ff]"
            />
            <Button
              type="button"
              disabled={isSubmitting || !email.trim()}
              onClick={() => void sendResetLink()}
              className="mt-2 w-full rounded-2xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>

          {message && (
            <p className="figma-text-sm figma-track-sm text-center text-[#0d47a1]">{message}</p>
          )}
          {error && (
            <p className="figma-text-sm figma-track-sm text-center text-[#df1c41]">{error}</p>
          )}

          <p className="figma-text-sm figma-track-sm text-center text-[#666d80]">
            Remembered your password?{" "}
            <Link to="/login" className="font-semibold text-[#0d47a1]">
              Back to Login
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export { ForgotPasswordPage }
