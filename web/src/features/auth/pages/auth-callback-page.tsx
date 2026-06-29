import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { createAuthApi } from "@/lib/api/auth"
import { createUsersApi } from "@/lib/api/users"
import { fetchPostAuthDestination } from "@/lib/auth/fetch-post-auth-destination"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

const PKCE_EXCHANGE_PREFIX = "betterlsat:pkce-exchanged:"
const inflightPkceExchanges = new Map<string, Promise<void>>()

function stripAuthParamsFromUrl() {
  const url = new URL(window.location.href)
  url.searchParams.delete("code")
  url.searchParams.delete("state")
  url.searchParams.delete("error")
  url.searchParams.delete("error_description")
  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState({}, "", next)
}

/** Deduplicates PKCE exchange across React StrictMode double-mounts and remounts. */
async function exchangePkceCodeOnce(
  exchange: (code: string) => Promise<void>,
  code: string,
): Promise<void> {
  const exchangeKey = `${PKCE_EXCHANGE_PREFIX}${code}`
  if (sessionStorage.getItem(exchangeKey) === "1") return

  let inflight = inflightPkceExchanges.get(code)
  if (!inflight) {
    inflight = exchange(code)
      .then(() => {
        sessionStorage.setItem(exchangeKey, "1")
      })
      .finally(() => {
        inflightPkceExchanges.delete(code)
      })
    inflightPkceExchanges.set(code, inflight)
  }

  await inflight
}

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

        if (code) {
          await exchangePkceCodeOnce((authCode) => authApi.exchangeCodeForSession(authCode), code)
          stripAuthParamsFromUrl()
        }

        const hasSession = await authApi.hasSession()
        if (!hasSession) {
          throw new Error("Auth session not found. Please request a new login link from the same browser.")
        }

        if (flowType === "recovery") {
          navigate("/reset-password", { replace: true })
          return
        }

        navigate(await fetchPostAuthDestination(usersApi), { replace: true })
      } catch (callbackError) {
        if (!isActive) return
        setError(
          callbackError instanceof Error
            ? formatSupabaseCallError(callbackError)
            : "Unable to complete authentication.",
        )
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
        <>
          <p className="text-sm text-[#df1c41]">{error}</p>
          <Link to="/login" className="text-sm font-semibold text-[#0d47a1] hover:underline">
            Back to login
          </Link>
        </>
      ) : (
        <p className="text-sm text-[#666d80]">Please wait while we verify your authentication.</p>
      )}
    </main>
  )
}

export { AuthCallbackPage, exchangePkceCodeOnce }
