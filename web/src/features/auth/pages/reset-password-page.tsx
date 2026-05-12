import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { createAuthApi } from "@/lib/api/auth"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

const MIN_PASSWORD_LENGTH = 6

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const authApi = useMemo(() => {
    try {
      return createAuthApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function checkSession() {
      if (!authApi) {
        if (isActive) {
          setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setHasSession(false)
        }
        return
      }

      try {
        const ok = await authApi.hasSession()
        if (isActive) setHasSession(ok)
      } catch {
        if (isActive) setHasSession(false)
      }
    }

    void checkSession()
    return () => {
      isActive = false
    }
  }, [authApi])

  async function submitNewPassword() {
    if (!authApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await authApi.updatePassword(password)
      navigate("/app", { replace: true })
    } catch (updateError) {
      setError(updateError instanceof Error ? formatSupabaseCallError(updateError) : "Unable to update password.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasSession === false) {
    return (
      <AuthLayout ctaLabel="Sign Up" ctaHref="/signup" headerVariant="auth">
        <AuthCard className="bg-[#f2f7ff]">
          <div className="figma-gap-24 flex flex-col">
            <h1 className="figma-track-md text-center">Reset link expired</h1>
            <p className="figma-text-sm figma-track-sm text-center text-[#666d80]">
              {error ?? "This password reset link is invalid or has expired. Please request a new one."}
            </p>
            <Link
              to="/forgot-password"
              className="figma-text-sm figma-track-sm text-center font-semibold text-[#0d47a1]"
            >
              Request a new reset link
            </Link>
          </div>
        </AuthCard>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout ctaLabel="Sign Up" ctaHref="/signup" headerVariant="auth">
      <AuthCard className="bg-[#f2f7ff]">
        <div className="figma-gap-24 flex flex-col">
          <div className="figma-gap-8 flex flex-col">
            <h1 className="figma-track-md text-center">Set a new password</h1>
            <p className="figma-text-sm figma-track-sm text-center text-[#666d80]">
              Choose a strong password you haven&apos;t used before.
            </p>
          </div>

          <div className="figma-gap-12 flex flex-col">
            <div className="figma-gap-8 flex flex-col">
              <p className="figma-text-sm figma-track-sm font-medium text-[#062357]">
                New Password<span className="text-[#df1c41]">*</span>
              </p>
              <Input
                size="lg"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a new password"
                className="rounded-2xl bg-[#f2f7ff]"
              />
            </div>
            <div className="figma-gap-8 flex flex-col">
              <p className="figma-text-sm figma-track-sm font-medium text-[#062357]">
                Confirm Password<span className="text-[#df1c41]">*</span>
              </p>
              <Input
                size="lg"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your new password"
                className="rounded-2xl bg-[#f2f7ff]"
              />
            </div>
            <Button
              type="button"
              disabled={isSubmitting || hasSession !== true || !password || !confirmPassword}
              onClick={() => void submitNewPassword()}
              className="mt-2 w-full rounded-2xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </div>

          {error && (
            <p className="figma-text-sm figma-track-sm text-center text-[#df1c41]">{error}</p>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export { ResetPasswordPage }
