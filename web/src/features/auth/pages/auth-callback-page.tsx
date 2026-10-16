import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import type { EmailOtpType } from "@supabase/supabase-js"

import { readAttribution } from "@/lib/analytics/attribution"
import { trackFreeDiagnosticSignupAndWait } from "@/lib/analytics/gtm"
import { AnalyticsEvent, captureEvent } from "@/lib/analytics/posthog"
import { createAuthApi } from "@/lib/api/auth"
import { createUsersApi } from "@/lib/api/users"
import { fetchPostAuthDestination } from "@/lib/auth/fetch-post-auth-destination"
import {
  readPendingCheckoutPlan,
  resolvePendingCheckoutDestination,
} from "@/lib/auth/pending-checkout-plan"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

const PKCE_EXCHANGE_PREFIX = "betterlsat:pkce-exchanged:"
const TOKEN_HASH_VERIFY_PREFIX = "betterlsat:token-hash-verified:"
const SIGNUP_CONVERSION_PREFIX = "betterlsat:signup-conversion:"
const SIGNUP_CONVERSION_PUSHED_PREFIX = "betterlsat:signup-conversion-pushed:"
const inflightPkceExchanges = new Map<string, Promise<void>>()
const inflightTokenHashVerifies = new Map<string, Promise<void>>()
const inflightSignupConversions = new Map<
  string,
  Promise<{
    tracked: boolean
    alreadyTracked?: boolean
    ineligible?: boolean
    eventId: string
    email: string | null
    attribution: Record<string, unknown> | null
  }>
>()

const EMAIL_OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
])

function parseEmailOtpType(raw: string | null): EmailOtpType | null {
  if (!raw || !EMAIL_OTP_TYPES.has(raw)) return null
  return raw as EmailOtpType
}

function stripAuthParamsFromUrl() {
  const url = new URL(window.location.href)
  url.searchParams.delete("code")
  url.searchParams.delete("state")
  url.searchParams.delete("token_hash")
  url.searchParams.delete("type")
  url.searchParams.delete("error")
  url.searchParams.delete("error_description")
  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState({}, "", next)
}

/** Deduplicates a one-shot auth exchange across React StrictMode double-mounts. */
async function runAuthExchangeOnce(
  storagePrefix: string,
  inflightMap: Map<string, Promise<void>>,
  key: string,
  exchange: () => Promise<void>,
): Promise<void> {
  const storageKey = `${storagePrefix}${key}`
  if (sessionStorage.getItem(storageKey) === "1") return

  let inflight = inflightMap.get(key)
  if (!inflight) {
    inflight = exchange()
      .then(() => {
        sessionStorage.setItem(storageKey, "1")
      })
      .finally(() => {
        inflightMap.delete(key)
      })
    inflightMap.set(key, inflight)
  }

  await inflight
}

/** Deduplicates PKCE exchange across React StrictMode double-mounts and remounts. */
async function exchangePkceCodeOnce(
  exchange: (code: string) => Promise<void>,
  code: string,
): Promise<void> {
  await runAuthExchangeOnce(PKCE_EXCHANGE_PREFIX, inflightPkceExchanges, code, () => exchange(code))
}

async function verifyTokenHashOnce(
  verify: (tokenHash: string, type: EmailOtpType) => Promise<void>,
  tokenHash: string,
  type: EmailOtpType,
): Promise<void> {
  const key = `${type}:${tokenHash}`
  await runAuthExchangeOnce(TOKEN_HASH_VERIFY_PREFIX, inflightTokenHashVerifies, key, () =>
    verify(tokenHash, type),
  )
}

type SignupConversionResult = {
  tracked: boolean
  alreadyTracked?: boolean
  ineligible?: boolean
  eventId: string
  email: string | null
  attribution: Record<string, unknown> | null
}

/** Share one signup-conversion claim across StrictMode double-mounts. */
async function trackSignupConversionOnce(
  userId: string,
  track: () => Promise<SignupConversionResult>,
): Promise<SignupConversionResult> {
  const storageKey = `${SIGNUP_CONVERSION_PREFIX}${userId}`
  const cached = sessionStorage.getItem(storageKey)
  if (cached) {
    try {
      return JSON.parse(cached) as SignupConversionResult
    } catch {
      // Fall through and re-run.
    }
  }

  let inflight = inflightSignupConversions.get(userId)
  if (!inflight) {
    inflight = track()
      .then((result) => {
        sessionStorage.setItem(storageKey, JSON.stringify(result))
        return result
      })
      .finally(() => {
        inflightSignupConversions.delete(userId)
      })
    inflightSignupConversions.set(userId, inflight)
  }
  return await inflight
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
        const tokenHash = url.searchParams.get("token_hash")
        const flowType = url.searchParams.get("type")
        const otpType = parseEmailOtpType(flowType)
        const authError = url.searchParams.get("error_description") ?? url.searchParams.get("error")

        if (authError) throw new Error(authError)

        if (tokenHash && otpType) {
          await verifyTokenHashOnce(
            (hash, type) => authApi.verifyOtpWithTokenHash(hash, type),
            tokenHash,
            otpType,
          )
          stripAuthParamsFromUrl()
        } else if (code) {
          await exchangePkceCodeOnce((authCode) => authApi.exchangeCodeForSession(authCode), code)
          stripAuthParamsFromUrl()
        }

        const session = await authApi.getSession()
        if (!session?.user) {
          throw new Error("Auth session not found. Please request a new login link from the same browser.")
        }

        if (flowType === "recovery") {
          navigate("/reset-password", { replace: true })
          return
        }

        captureEvent(AnalyticsEvent.authCompleted)

        let conversionWait: Promise<void> = Promise.resolve()
        try {
          const conversion = await trackSignupConversionOnce(session.user.id, () =>
            usersApi.trackSignupConversion({
              attribution: readAttribution(),
              checkoutPlan: readPendingCheckoutPlan() ?? "free",
              eventSourceUrl: window.location.href,
            }),
          )
          const pushKey = `${SIGNUP_CONVERSION_PUSHED_PREFIX}${session.user.id}`
          if (conversion.tracked && sessionStorage.getItem(pushKey) !== "1") {
            sessionStorage.setItem(pushKey, "1")
            const payload = {
              user_email: conversion.email ?? session.user.email ?? null,
              user_id: session.user.id,
              event_id: conversion.eventId,
              ...(conversion.attribution ?? {}),
            }
            captureEvent(AnalyticsEvent.freeDiagnosticSignup, payload)
            conversionWait = trackFreeDiagnosticSignupAndWait(payload, 300)
          }
        } catch (conversionError) {
          // Conversion tracking must not block auth completion.
          console.warn("Signup conversion tracking failed:", conversionError)
        }

        const destination = resolvePendingCheckoutDestination(
          await fetchPostAuthDestination(usersApi),
        )
        await conversionWait
        navigate(destination, { replace: true })
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

export { AuthCallbackPage, exchangePkceCodeOnce, verifyTokenHashOnce }
