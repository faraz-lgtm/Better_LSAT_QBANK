import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppToast } from "@/components/ui/app-toast"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { createBillingApi } from "@/lib/api/billing"
import { createUsersApi, type AccessState } from "@/lib/api/users"
import { logRouteRedirect } from "@/lib/auth/log-route-redirect"
import { useAppToast } from "@/hooks/use-app-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatEdgeFunctionError } from "@/lib/supabase/format-call-error"

const PENDING_POLL_MS = 15_000
const PENDING_POLL_MAX_MS = 120_000

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

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [accessState, setAccessState] = useState<AccessState | null>(null)
  const [isPendingCoachLink, setIsPendingCoachLink] = useState(false)
  const [billingAvailable, setBillingAvailable] = useState(false)
  const pendingPollStartedAt = useRef<number | null>(null)
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

  const refreshEntitlement = useCallback(async (): Promise<AccessState | null> => {
    if (!usersApi) return null
    try {
      await usersApi.lawHubRefresh()
    } catch {
      // Refresh may fail before first link; entitlement check still applies.
    }
    const entitlement = await usersApi.getEntitlementState()
    setAccessState(entitlement.accessState)
    if (entitlement.accessState === "FULL_ACCESS") {
      logRouteRedirect("/app/lsac-link", "/app", "FULL_ACCESS after refresh")
      navigate("/app", { replace: true })
      return entitlement.accessState
    }
    if (entitlement.accessState === "PAYMENT_REQUIRED") {
      setIsPendingCoachLink(false)
      return entitlement.accessState
    }
    if (entitlement.isLsacLinked && !entitlement.isLsacEligible) {
      setIsPendingCoachLink(true)
    }
    return entitlement.accessState
  }, [navigate, usersApi])

  useEffect(() => {
    let alive = true
    logRouteRedirect(window.location.pathname, window.location.pathname, "lsac-link page mounted")
    async function loadProfile() {
      if (!usersApi) {
        if (alive) {
          setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setIsLoading(false)
        }
        return
      }
      try {
        const profile = await usersApi.getMyProfile()
        if (!alive) return
        if (!profile) {
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
        if (entitlement.accessState === "PAYMENT_REQUIRED") {
          logRouteRedirect("/app/lsac-link", "/app/lsac-link", "PAYMENT_REQUIRED on load")
        }

        setAccessState(entitlement.accessState)
        if (entitlement.isLsacLinked && !entitlement.isLsacEligible) {
          setIsPendingCoachLink(true)
        }

        const names = splitFullName(profile.full_name)
        setFirstName(names.firstName)
        setLastName(names.lastName)

        if (billingApi) {
          try {
            await billingApi.getStatus()
            if (!alive) return
            setBillingAvailable(true)
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
    if (!isPendingCoachLink || !usersApi) return

    pendingPollStartedAt.current = Date.now()
    const interval = window.setInterval(() => {
      const startedAt = pendingPollStartedAt.current ?? Date.now()
      if (Date.now() - startedAt >= PENDING_POLL_MAX_MS) {
        window.clearInterval(interval)
        return
      }
      void refreshEntitlement()
    }, PENDING_POLL_MS)

    return () => window.clearInterval(interval)
  }, [isPendingCoachLink, refreshEntitlement, usersApi])

  function validateNames(): boolean {
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required for LawHub registration.")
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

  async function afterLinkAttempt() {
    if (!usersApi) return
    setStatusMessage("Checking LawHub link status…")
    const nextState = await refreshEntitlement()
    if (nextState === "FULL_ACCESS") return
    setIsPendingCoachLink(true)
    setStatusMessage(null)
  }

  async function completeVendorLawHubLink() {
    if (!usersApi || !validateNames()) return
    setIsSubmitting(true)
    setError(null)
    setStatusMessage(null)
    try {
      setStatusMessage("Connecting your LawHub account…")
      await usersApi.lawHubLink({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        path: "vendor",
      })
      setStatusMessage("Logging access with LSAC…")
      await usersApi.lawHubLogLogin()
      await afterLinkAttempt()
    } catch (linkError) {
      const message = presentLinkError(linkError, "Unable to link LawHub account.")
      if (message.includes("subscription required")) {
        setError("Choose a Core or Live plan before linking LawHub.")
        showError(message)
        logRouteRedirect("/app/lsac-link", "/app/pricing", "vendor link rejected: subscription required", {
          error: message,
        })
        navigate("/app/pricing", { replace: true })
      } else {
        setError(message)
        showError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function linkExistingPrepPlus() {
    if (!usersApi || !validateNames()) return
    setIsSubmitting(true)
    setError(null)
    setStatusMessage(null)
    try {
      setStatusMessage("Linking your existing LawHub PrepPlus account…")
      await usersApi.lawHubLink({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        path: "existing",
      })
      setStatusMessage("Logging access with LSAC…")
      await usersApi.lawHubLogLogin()
      await afterLinkAttempt()
    } catch (linkError) {
      const message = presentLinkError(linkError, "Unable to link LawHub account.")
      if (message.includes("subscription required")) {
        setError("Choose a Core or Live plan before linking your existing PrepPlus.")
        showError(message)
        navigate("/app/pricing", { replace: true })
      } else {
        setError(message.includes("not configured") ? "LawHub is not configured on the server." : message)
        showError(message.includes("not configured") ? "LawHub is not configured on the server." : message)
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
  const canLink = !paymentRequired

  return (
    <AuthLayout ctaLabel="Log In" ctaHref="/login" headerVariant="app" contentLayout="lsac-link">
      {toast ? <AppToast toast={toast} onDismiss={dismiss} /> : null}
      <div className="lsac-link-page">
        <AuthCard className="lsac-link-card">
          <div className="lsac-link-page__header">
            <h1>Link your LawHub account</h1>
            <p>Connect Official LSAT PrepPlus through LawHub to access Better LSAT.</p>
          </div>

          {checkoutSuccess && (
            <p className="lsac-link-page__alert lsac-link-page__alert--status">
              Payment received. Complete LawHub setup below to access the app.
            </p>
          )}

          {paymentRequired && (
            <p className="lsac-link-page__alert lsac-link-page__alert--error">
              Choose a Core or Live plan to continue. LawHub linking unlocks after checkout.
            </p>
          )}

          {isPendingCoachLink && !paymentRequired && (
            <div className="lsac-link-page__alert lsac-link-page__alert--status">
              <p>
                Check your email from LSAC — click <strong>Link to Coach</strong>, sign in to LawHub, then return
                here.
              </p>
              <Button
                className="mt-3 w-full"
                variant="outline"
                disabled={isRefreshing || isSubmitting}
                onClick={() => void handlePendingRefresh()}
              >
                {isRefreshing ? "Checking…" : "I've linked my coach"}
              </Button>
            </div>
          )}

          {error && <p className="lsac-link-page__alert lsac-link-page__alert--error">{error}</p>}
          {statusMessage && !error && (
            <p className="lsac-link-page__alert lsac-link-page__alert--status">{statusMessage}</p>
          )}

          {!isPendingCoachLink && (
            <>
              <div className="lsac-link-page__names">
                <div className="lsac-link-page__field">
                  <label htmlFor="lsac-first-name">First name</label>
                  <Input
                    id="lsac-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    disabled={!canLink || isSubmitting}
                  />
                </div>
                <div className="lsac-link-page__field">
                  <label htmlFor="lsac-last-name">Last name</label>
                  <Input
                    id="lsac-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    disabled={!canLink || isSubmitting}
                  />
                </div>
              </div>

              <div className="lsac-link-page__options">
                <div className="lsac-link-page__option">
                  <h2>PrepPlus included with your plan</h2>
                  <p>Register or link LawHub using the name above and your signup email.</p>
                  <Button
                    className="w-full"
                    disabled={isSubmitting || !canLink}
                    onClick={() => void completeVendorLawHubLink()}
                  >
                    {isSubmitting ? "Linking…" : "Complete LawHub setup"}
                  </Button>
                </div>

                <div className="lsac-link-page__option">
                  <h2>I already have LawHub PrepPlus</h2>
                  <p>Link your existing LawHub account after subscribing to Core or Live.</p>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={isSubmitting || !canLink}
                    onClick={() => void linkExistingPrepPlus()}
                  >
                    {isSubmitting ? "Linking…" : "Link existing PrepPlus"}
                  </Button>
                </div>
              </div>
            </>
          )}

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
