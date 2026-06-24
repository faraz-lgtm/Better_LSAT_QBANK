import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { createAuthApi, getPasswordResetCallbackUrl } from "@/lib/api/auth"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
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

  async function sendResetLink() {
    if (!authApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    setError(null)
    setMessage(null)
    try {
      const sent = await withSubmitLock(async () => {
        await authApi.sendPasswordResetEmail(email.trim(), getPasswordResetCallbackUrl())
        setMessage("Reset link sent. Check your inbox to continue.")
      })
      if (!sent) return
    } catch (resetError) {
      setError(resetError instanceof Error ? formatSupabaseCallError(resetError) : "Unable to send reset link.")
    }
  }

  return (
    <AuthLayout ctaLabel="Sign Up" ctaHref="/signup" headerVariant="auth">
      <AuthCard>
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
              disabled={isSubmitting}
            />
            <Button
              type="button"
              disabled={isSubmitting || !email.trim()}
              aria-busy={isSubmitting}
              onClick={() => void sendResetLink()}
              className="ds-btn mt-2 w-full gap-2"
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
                "Send Reset Link"
              )}
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
