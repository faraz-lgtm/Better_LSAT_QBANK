import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { SocialButton } from "@/components/ui/social-button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { createAuthApi, getAuthCallbackUrl } from "@/lib/api/auth"
import { createUsersApi } from "@/lib/api/users"
import { getPostAuthDestination } from "@/lib/auth/post-auth-redirect"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function LoginPage() {
  const navigate = useNavigate()
  const [magicEmail, setMagicEmail] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isMagicLoading, setIsMagicLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  async function sendMagicLink() {
    if (!authApi || !usersApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    setIsMagicLoading(true)
    setError(null)
    setMessage(null)
    try {
      await authApi.sendMagicLink(magicEmail.trim(), getAuthCallbackUrl())
      setMessage("Magic link sent. Check your inbox to continue.")
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to send magic link.")
    } finally {
      setIsMagicLoading(false)
    }
  }

  async function signInWithPassword() {
    if (!authApi || !usersApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    setIsPasswordLoading(true)
    setError(null)
    setMessage(null)
    try {
      await authApi.signInWithPassword(email.trim(), password)
      const profile = await usersApi.getMyProfile()
      navigate(getPostAuthDestination(profile), { replace: true })
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to sign in with email and password.")
    } finally {
      setIsPasswordLoading(false)
    }
  }

  async function signInWithGoogle() {
    if (!authApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    setIsGoogleLoading(true)
    setError(null)
    setMessage(null)
    try {
      await authApi.signInWithGoogle(getAuthCallbackUrl())
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to continue with Google.")
      setIsGoogleLoading(false)
    }
  }

  return (
    <AuthLayout ctaLabel="Sign Up" ctaHref="/signup" headerVariant="auth">
      <AuthCard className="bg-[#f2f7ff]">
        <div className="figma-gap-24 flex flex-col">
          <h1 className="figma-track-md text-center">Login with</h1>

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
              className="rounded-2xl bg-[#f2f7ff]"
            />
            <Button
              type="button"
              disabled={isMagicLoading || !magicEmail.trim()}
              onClick={() => void sendMagicLink()}
              className="mt-2 w-full rounded-2xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90"
            >
              {isMagicLoading ? "Sending..." : "Send Magic Link"}
            </Button>
          </div>

          <div className="figma-gap-12 flex items-center">
            <div className="h-px flex-1 bg-[#dfe1e7]" />
            <span className="figma-text-lg figma-track-md font-semibold text-[#666d80]">OR</span>
            <div className="h-px flex-1 bg-[#dfe1e7]" />
          </div>

          <div className="figma-gap-12 flex flex-col">
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
            </div>
            <div className="figma-gap-8 flex flex-col">
              <p className="figma-text-sm figma-track-sm font-medium text-[#062357]">
                Password<span className="text-[#df1c41]">*</span>
              </p>
              <Input
                type="password"
                size="lg"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="rounded-2xl bg-[#f2f7ff]"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="figma-gap-8 figma-text-sm figma-track-sm inline-flex items-center font-medium text-[#666d80]">
                <Checkbox size="sm" />
                Keep me login
              </label>
              <Link to="/forgot-password" className="figma-text-sm figma-track-sm font-semibold text-[#0d47a1]">
                Forgot Password?
              </Link>
            </div>
            <Button
              type="button"
              disabled={isPasswordLoading || !email.trim() || !password}
              onClick={() => void signInWithPassword()}
              className="w-full rounded-2xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90"
            >
              {isPasswordLoading ? "Signing in..." : "Sign In"}
            </Button>
          </div>

          <div className="figma-gap-12 flex items-center">
            <div className="h-px flex-1 bg-[#dfe1e7]" />
            <span className="figma-text-lg figma-track-md font-semibold text-[#666d80]">OR</span>
            <div className="h-px flex-1 bg-[#dfe1e7]" />
          </div>

          {message && <p className="figma-text-sm figma-track-sm text-center text-[#0d47a1]">{message}</p>}
          {error && <p className="figma-text-sm figma-track-sm text-center text-[#df1c41]">{error}</p>}

          <SocialButton
            className="w-full justify-center rounded-2xl bg-[#f2f7ff]"
            disabled={isGoogleLoading}
            onClick={() => void signInWithGoogle()}
          >
            {isGoogleLoading ? "Redirecting..." : "Sign in with Google"}
          </SocialButton>

          <p className="figma-text-sm figma-track-sm text-center text-[#666d80]">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="font-semibold text-[#0d47a1]">
              Sign Up
            </a>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export { LoginPage }
