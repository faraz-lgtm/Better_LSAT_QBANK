import { useMemo, useRef, useState, type MutableRefObject } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { SocialButton } from "@/components/ui/social-button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { createAuthApi, getAuthCallbackUrl } from "@/lib/api/auth"
import { createUsersApi } from "@/lib/api/users"
import { getPostAuthDestination } from "@/lib/auth/post-auth-redirect"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

function LoginPage() {
  const navigate = useNavigate()
  const [magicEmail, setMagicEmail] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isMagicLoading, setIsMagicLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const magicLockRef = useRef(false)
  const passwordLockRef = useRef(false)

  const authApi = useMemo(() => {
    try {
      return createAuthApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])
  const usersApi = useMemo(() => {
    try {
      return createUsersApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const isBusy = isMagicLoading || isPasswordLoading || googleLoading

  async function withSubmitLock(
    lockRef: MutableRefObject<boolean>,
    setLoading: (loading: boolean) => void,
    task: () => Promise<void>,
  ): Promise<boolean> {
    if (lockRef.current) return false
    lockRef.current = true
    setLoading(true)
    try {
      await task()
      return true
    } finally {
      lockRef.current = false
      setLoading(false)
    }
  }

  async function sendMagicLink() {
    if (!authApi || !usersApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    setError(null)
    setMessage(null)
    try {
      const sent = await withSubmitLock(magicLockRef, setIsMagicLoading, async () => {
        await authApi.sendMagicLink(magicEmail.trim(), getAuthCallbackUrl())
        setMessage("Magic link sent. Check your inbox to continue.")
      })
      if (!sent) return
    } catch (authError) {
      setError(authError instanceof Error ? formatSupabaseCallError(authError) : "Unable to send magic link.")
    }
  }

  async function signInWithPassword() {
    if (!authApi || !usersApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    setError(null)
    setMessage(null)
    try {
      const sent = await withSubmitLock(passwordLockRef, setIsPasswordLoading, async () => {
        await authApi.signInWithPassword(email.trim(), password)
        const profile = await usersApi.getMyProfile()
        navigate(getPostAuthDestination(profile), { replace: true })
      })
      if (!sent) return
    } catch (authError) {
      setError(authError instanceof Error ? formatSupabaseCallError(authError) : "Unable to sign in with email and password.")
    }
  }

  async function signInWithGoogle() {
    if (!authApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    if (isBusy) return

    setGoogleLoading(true)
    setError(null)
    setMessage(null)
    try {
      await authApi.signInWithGoogle(getAuthCallbackUrl())
    } catch (authError) {
      setError(authError instanceof Error ? formatSupabaseCallError(authError) : "Unable to continue with Google.")
      setGoogleLoading(false)
    }
  }

  return (
    <AuthLayout ctaLabel="Sign Up" ctaHref="/signup">
      <AuthCard>
        <div className="figma-gap-24 flex flex-col">
          <h1 className="figma-track-md text-center">Login with</h1>

          <div className="figma-gap-16 flex flex-col">
            <div className="figma-gap-8 flex flex-col">
              <p className="figma-text-sm figma-track-sm font-medium text-[#062357]">
                Email for Magic Link<span className="text-[#df1c41]">*</span>
              </p>
              <Input
                size="lg"
                type="email"
                value={magicEmail}
                onChange={(event) => setMagicEmail(event.target.value)}
                placeholder="Enter your email"
                disabled={isBusy}
              />
            </div>
            <Button
              type="button"
              disabled={isBusy || !magicEmail.trim()}
              aria-busy={isMagicLoading}
              onClick={() => void sendMagicLink()}
              className="ds-btn w-full gap-2"
            >
              {isMagicLoading ? (
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
          </div>

          <div className="figma-gap-12 flex items-center">
            <div className="h-px flex-1 bg-[#dfe1e7]" />
            <span className="figma-text-lg figma-track-md font-semibold text-[#666d80]">OR</span>
            <div className="h-px flex-1 bg-[#dfe1e7]" />
          </div>

          <div className="figma-gap-16 flex flex-col">
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
                disabled={isBusy}
              />
            </div>
            <div className="figma-gap-8 flex flex-col">
              <p className="figma-text-sm figma-track-sm font-medium text-[#062357]">
                Password<span className="text-[#df1c41]">*</span>
              </p>
              <PasswordInput
                size="lg"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isBusy}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="figma-gap-8 figma-text-sm figma-track-sm inline-flex items-center font-medium text-[#666d80]">
                <Checkbox size="md" disabled={isBusy} />
                Keep me login
              </label>
              <Link to="/forgot-password" className="figma-text-sm figma-track-sm font-semibold text-[#0d47a1]">
                Forgot Password?
              </Link>
            </div>
            <Button
              type="button"
              disabled={isBusy || !email.trim() || !password}
              aria-busy={isPasswordLoading}
              onClick={() => void signInWithPassword()}
              className="ds-btn w-full gap-2"
            >
              {isPasswordLoading ? (
                <>
                  <span
                    className="size-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </div>

          {message && <p className="figma-text-sm figma-track-sm text-center text-[#0d47a1]">{message}</p>}
          {error && <p className="figma-text-sm figma-track-sm text-center text-[#df1c41]">{error}</p>}

          <SocialButton
            disabled={isBusy}
            aria-busy={googleLoading}
            onClick={() => void signInWithGoogle()}
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
      </AuthCard>
    </AuthLayout>
  )
}

export { LoginPage }
