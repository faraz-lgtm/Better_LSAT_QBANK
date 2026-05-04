import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { createAuthApi } from "@/lib/api/auth"
import { createUsersApi } from "@/lib/api/users"
import { getPostAuthDestination } from "@/lib/auth/post-auth-redirect"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function AuthCallbackPage() {
  const navigate = useNavigate()
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

  useEffect(() => {
    let isActive = true

    async function completeAuth() {
      if (!authApi || !usersApi) {
        if (isActive) setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
        return
      }

      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get("code")
        const flowType = url.searchParams.get("type")
        const authError = url.searchParams.get("error_description") ?? url.searchParams.get("error")

        if (authError) throw new Error(authError)
        if (code) await authApi.exchangeCodeForSession(code)

        const hasSession = await authApi.hasSession()
        if (!isActive) return
        if (!hasSession) throw new Error("Auth session not found. Please request a new login link.")

        if (flowType === "recovery") {
          navigate("/reset-password", { replace: true })
          return
        }

        const profile = await usersApi.getMyProfile()
        navigate(getPostAuthDestination(profile), { replace: true })
      } catch (callbackError) {
        if (!isActive) return
        setError(callbackError instanceof Error ? callbackError.message : "Unable to complete authentication.")
      }
    }

    void completeAuth()
    return () => {
      isActive = false
    }
  }, [authApi, navigate, usersApi])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="text-2xl font-semibold text-[#062357]">Completing sign in...</h1>
      {error ? (
        <p className="text-sm text-[#df1c41]">{error}</p>
      ) : (
        <p className="text-sm text-[#666d80]">Please wait while we verify your authentication.</p>
      )}
    </main>
  )
}

export { AuthCallbackPage }
