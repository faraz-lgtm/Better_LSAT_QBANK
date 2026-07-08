import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppToast } from "@/components/ui/app-toast"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { createBillingApi } from "@/lib/api/billing"
import { createUsersApi, type AccessState, type UserProfile } from "@/lib/api/users"
import { logRouteRedirect } from "@/lib/auth/log-route-redirect"
import { isInDiagnosticAcquisitionFunnel } from "@/lib/auth/diagnostic-intent"
import { useAppToast } from "@/hooks/use-app-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatEdgeFunctionError } from "@/lib/supabase/format-call-error"

const CHECKOUT_POLL_MS = 4_000
const CHECKOUT_POLL_MAX_MS = 30_000
const AWAITING_EMAIL_POLL_MS = 15_000
const AWAITING_EMAIL_POLL_MAX_MS = 120_000

type SetupPhase = "processing" | "awaitingEmail" | "fallbackInvite" | "fallbackName"

function splitFullName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  const trimmed = fullName?.trim() ?? ""
  if (!trimmed) return { firstName: "", lastName: "" }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" }
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") }
}

function LsacLinkPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const checkoutSuccess = searchParams.get("checkout") === "success"

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessState, setAccessState] = useState<AccessState | null>(null)
  const [isLsacEligible, setIsLsacEligible] = useState(false)
  const [processingTimedOut, setProcessingTimedOut] = useState(false)
  const [lawHubPath, setLawHubPath] = useState<"vendor" | "existing">("vendor")
  const [showExistingPath, setShowExistingPath] = useState(false)
  const [billingAvailable, setBillingAvailable] = useState(false)
  const checkoutPollStartedAt = useRef<number | null>(null)
  const awaitingPollStartedAt = useRef<number | null>(null)
  const { toast, showError, dismiss } = useAppToast()

  const usersApi = useMemo(() => {
    try {
      return createUsersApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const billingApi = useMemo(() => {
    try {
      return createBillingApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const hasCoachingId = Boolean(profile?.student_coaching_id?.trim())
  const profileHasName = Boolean(profile?.full_name?.trim())

  const phase: SetupPhase | "done" = useMemo(() => {
    if (accessState === "FULL_ACCESS") return "done"
    if (checkoutSuccess && !hasCoachingId && !processingTimedOut) return "processing"
    if (hasCoachingId && !isLsacEligible) return "awaitingEmail"
    if (!hasCoachingId) {
      if (!profileHasName && !firstName.trim()) return "fallbackName"
      return "fallbackInvite"
    }
    return "awaitingEmail"
  }, [
    accessState,
    checkoutSuccess,
    firstName,
    hasCoachingId,
    isLsacEligible,
    processingTimedOut,
    profileHasName,
  ])

  const refreshEntitlement = useCallback(async (): Promise<AccessState | null> => {
    if (!usersApi) return null
    try {
      await usersApi.lawHubRefresh()
    } catch {
      // Refresh may fail before first link; entitlement check still applies.
    }
    const entitlement = await usersApi.getEntitlementState()
    setAccessState(entitlement.accessState)
    setIsLsacEligible(entitlement.isLsacEligible)
    if (entitlement.accessState === "FULL_ACCESS") {
      logRouteRedirect("/app/lsac-link", "/app", "FULL_ACCESS after refresh")
      navigate("/app", { replace: true })
      return entitlement.accessState
    }
    return entitlement.accessState
  }, [navigate, usersApi])

  useEffect(() => {
    let alive = true
    logRouteRedirect(window.location.pathname, window.location.pathname, "lsac-link page mounted")
    async function loadProfile() {
      if (isInDiagnosticAcquisitionFunnel()) {
        logRouteRedirect("/app/lsac-link", "/diagnostic/start", "diagnostic acquisition funnel")
        navigate("/diagnostic/start", { replace: true })
        return
      }
      if (!usersApi) {
        if (alive) {
          setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setIsLoading(false)
        }
        return
      }
      try {
        const nextProfile = await usersApi.getMyProfile()
        if (!alive) return
        if (!nextProfile) {
          logRouteRedirect("/app/lsac-link", "/login", "no profile on load")
          navigate("/login", { replace: true })
          return
        }

        const entitlement = await usersApi.getEntitlementState()
        if (!alive) return

        if (entitlement.accessState === "FULL_ACCESS") {
          logRouteRedirect("/app/lsac-link", "/app", "FULL_ACCESS on load")
          navigate("/app", { replace: true })
          return
        }

        setProfile(nextProfile)
        setAccessState(entitlement.accessState)
        setIsLsacEligible(entitlement.isLsacEligible)

        const names = splitFullName(nextProfile.full_name)
        setFirstName(names.firstName)
        setLastName(names.lastName)

        if (billingApi) {
          try {
            const billing = await billingApi.getStatus()
            if (!alive) return
            setBillingAvailable(true)
            setLawHubPath(
              billing.prepPlusSource === "existing_lsac" ? "existing" : "vendor",
            )
          } catch (billingError) {
            if (!alive) return
            logRouteRedirect("/app/lsac-link", "/app/lsac-link", "billing status failed", {
              error: billingError instanceof Error ? billingError.message : String(billingError),
            })
            setBillingAvailable(false)
          }
        }
      } catch (loadError) {
        if (!alive) return
        setError(loadError instanceof Error ? formatEdgeFunctionError(loadError) : "Unable to load profile.")
      } finally {
        if (alive) setIsLoading(false)
      }
    }
    void loadProfile()
    return () => {
      alive = false
    }
  }, [billingApi, navigate, usersApi])

  useEffect(() => {
    if (phase !== "processing" || !usersApi) return

    checkoutPollStartedAt.current = Date.now()

    async function pollForCoachingId() {
      if (!usersApi) return
      try {
        const nextProfile = await usersApi.getMyProfile()
        if (nextProfile) {
          setProfile(nextProfile)
          if (nextProfile.student_coaching_id?.trim()) {
            await refreshEntitlement()
          }
        }
      } catch {
        // Keep polling until timeout.
      }
    }

    void pollForCoachingId()

    const interval = window.setInterval(() => {
      const startedAt = checkoutPollStartedAt.current ?? Date.now()
      if (Date.now() - startedAt >= CHECKOUT_POLL_MAX_MS) {
        setProcessingTimedOut(true)
        window.clearInterval(interval)
        return
      }
      void pollForCoachingId()
    }, CHECKOUT_POLL_MS)

    return () => window.clearInterval(interval)
  }, [phase, refreshEntitlement, usersApi])

  useEffect(() => {
    if (phase !== "awaitingEmail" || !usersApi) return

    awaitingPollStartedAt.current = Date.now()
    const interval = window.setInterval(() => {
      const startedAt = awaitingPollStartedAt.current ?? Date.now()
      if (Date.now() - startedAt >= AWAITING_EMAIL_POLL_MAX_MS) {
        window.clearInterval(interval)
        return
      }
      void refreshEntitlement()
    }, AWAITING_EMAIL_POLL_MS)

    return () => window.clearInterval(interval)
  }, [phase, refreshEntitlement, usersApi])

  function validateNames(requireLastName = true): boolean {
    if (!firstName.trim()) {
      setError("First name is required for LawHub registration.")
      return false
    }
    if (requireLastName && !lastName.trim()) {
      setError("Last name is required for LawHub registration.")
      return false
    }
    return true
  }

  function presentLinkError(linkError: unknown, fallback: string): string {
    const message = linkError instanceof Error ? formatEdgeFunctionError(linkError) : fallback
    if (message.includes("not configured")) {
      return "LawHub is not configured on the server. Contact support or try again later."
    }
    return message
  }

  async function sendLawHubInvite(path: "vendor" | "existing") {
    if (!usersApi || !validateNames()) return
    setIsSubmitting(true)
    setError(null)
    try {
      await usersApi.lawHubLink({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        path,
      })
      try {
        await usersApi.lawHubLogLogin()
      } catch {
        // Optional logging step.
      }
      const nextProfile = await usersApi.getMyProfile()
      if (nextProfile) setProfile(nextProfile)
      await refreshEntitlement()
    } catch (linkError) {
      const message = presentLinkError(linkError, "Unable to send LawHub invite.")
      if (message.includes("subscription required")) {
        setError("Choose a Core or Live plan before linking LawHub.")
        showError(message)
        navigate("/app/pricing", { replace: true })
      } else {
        setError(message)
        showError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePendingRefresh() {
    if (!usersApi) return
    setIsRefreshing(true)
    setError(null)
    try {
      await refreshEntitlement()
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? formatEdgeFunctionError(refreshError) : "Unable to refresh LawHub status."
      setError(message)
      showError(message)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <AuthLayout ctaLabel="Log In" ctaHref="/login" headerVariant="app" contentLayout="lsac-link">
        <StudentPageLoader centered label="Loading…" />
      </AuthLayout>
    )
  }

  const paymentRequired = accessState === "PAYMENT_REQUIRED" && billingAvailable && !checkoutSuccess

  return (
    <AuthLayout ctaLabel="Log In" ctaHref="/login" headerVariant="app" contentLayout="lsac-link">
      {toast ? <AppToast toast={toast} onDismiss={dismiss} /> : null}
      <div className="lsac-link-page">
        <AuthCard className="lsac-link-card">
          <div className="lsac-link-page__header">
            <h1>Complete LawHub setup</h1>
            <p>Link your Official LSAT PrepPlus through LawHub to access Better LSAT.</p>
          </div>

          {paymentRequired && (
            <p className="lsac-link-page__alert lsac-link-page__alert--error">
              Choose a Core or Live plan to continue. LawHub linking unlocks after checkout.
            </p>
          )}

          {phase === "processing" && (
            <div className="lsac-link-page__alert lsac-link-page__alert--status">
              <p>
                <strong>Payment received</strong> — your Better LSAT subscription is active. We&apos;re setting up
                your LawHub account…
              </p>
              <StudentPageLoader centered label="Setting up LawHub…" />
            </div>
          )}

          {phase === "awaitingEmail" && !paymentRequired && (
            <div className="lsac-link-page__instructions">
              <p className="lsac-link-page__alert lsac-link-page__alert--status">
                <strong>Payment successful.</strong> Your Better LSAT subscription is active.
              </p>
              <ol className="lsac-link-page__steps">
                <li>Check your email from LSAC (same address you used to sign up).</li>
                <li>
                  Click <strong>Activate</strong> or <strong>Link to Coach</strong> and sign in to LawHub.
                </li>
                <li>Return here and click the button below.</li>
              </ol>
              <p className="lsac-link-page__note">
                The LawHub fee goes to LSAC. One PrepPlus subscription works across prep platforms.
              </p>
              <Button
                className="w-full"
                disabled={isRefreshing || isSubmitting}
                onClick={() => void handlePendingRefresh()}
              >
                {isRefreshing ? "Checking…" : "I've linked my coach"}
              </Button>
            </div>
          )}

          {phase === "fallbackInvite" && !paymentRequired && (
            <div className="lsac-link-page__fallback">
              <p className="lsac-link-page__alert lsac-link-page__alert--status">
                {checkoutSuccess
                  ? "We're still finishing your LawHub setup. You can send the invite manually below."
                  : "Send a LawHub invite to finish linking your coach."}
              </p>
              <div className="lsac-link-page__names">
                <div className="lsac-link-page__field">
                  <label htmlFor="lsac-first-name">First name</label>
                  <Input
                    id="lsac-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="lsac-link-page__field">
                  <label htmlFor="lsac-last-name">Last name</label>
                  <Input
                    id="lsac-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={() => void sendLawHubInvite(lawHubPath)}
              >
                {isSubmitting ? "Sending…" : "Send LawHub invite"}
              </Button>
              {!showExistingPath ? (
                <p className="lsac-link-page__footer">
                  <button type="button" onClick={() => setShowExistingPath(true)}>
                    I already have LawHub PrepPlus
                  </button>
                </p>
              ) : (
                <Button
                  className="mt-2 w-full"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => void sendLawHubInvite("existing")}
                >
                  {isSubmitting ? "Sending…" : "Link existing PrepPlus instead"}
                </Button>
              )}
            </div>
          )}

          {phase === "fallbackName" && !paymentRequired && (
            <div className="lsac-link-page__fallback">
              <p className="lsac-link-page__alert lsac-link-page__alert--status">
                LSAC requires your legal name to register LawHub. Enter it below, then send your invite.
              </p>
              <div className="lsac-link-page__names">
                <div className="lsac-link-page__field">
                  <label htmlFor="lsac-first-name">First name</label>
                  <Input
                    id="lsac-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="lsac-link-page__field">
                  <label htmlFor="lsac-last-name">Last name</label>
                  <Input
                    id="lsac-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={() => void sendLawHubInvite(lawHubPath)}
              >
                {isSubmitting ? "Sending…" : "Send LawHub invite"}
              </Button>
            </div>
          )}

          {error && <p className="lsac-link-page__alert lsac-link-page__alert--error">{error}</p>}

          {paymentRequired && (
            <p className="lsac-link-page__footer">
              <button
                type="button"
                onClick={() => {
                  logRouteRedirect("/app/lsac-link", "/app/pricing", "user clicked Choose a plan")
                  navigate("/app/pricing")
                }}
              >
                Choose a plan to continue
              </button>
            </p>
          )}
        </AuthCard>
      </div>
    </AuthLayout>
  )
}

export { LsacLinkPage }
