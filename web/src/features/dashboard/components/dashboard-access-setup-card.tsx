import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createUsersApi, type AccessState, type UserEntitlement } from "@/lib/api/users"
import { formatEdgeFunctionError } from "@/lib/supabase/format-call-error"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PENDING_POLL_MS = 15_000
const PENDING_POLL_MAX_MS = 120_000

function splitFullName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  const trimmed = fullName?.trim() ?? ""
  if (!trimmed) return { firstName: "", lastName: "" }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" }
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") }
}

function DashboardAccessSetupCard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const checkoutSuccess = searchParams.get("checkout") === "success"

  const usersApi = useMemo(() => {
    try {
      return createUsersApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const [loading, setLoading] = useState(true)
  const [entitlement, setEntitlement] = useState<UserEntitlement | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const pendingPollStartedAt = useRef<number | null>(null)

  const refreshEntitlement = useCallback(async (): Promise<AccessState | null> => {
    if (!usersApi) return null
    try {
      await usersApi.lawHubRefresh()
    } catch {
      // Refresh may fail before first link; entitlement check still applies.
    }
    const next = await usersApi.getEntitlementState()
    setEntitlement(next)
    if (next.accessState === "FULL_ACCESS" && checkoutSuccess) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete("checkout")
      setSearchParams(nextParams, { replace: true })
    }
    return next.accessState
  }, [checkoutSuccess, searchParams, setSearchParams, usersApi])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!usersApi) {
        if (alive) setLoading(false)
        return
      }
      try {
        const [profile, nextEntitlement] = await Promise.all([
          usersApi.getMyProfile(),
          usersApi.getEntitlementState(),
        ])
        if (!alive) return
        setEntitlement(nextEntitlement)
        const names = splitFullName(profile?.full_name)
        setFirstName(names.firstName)
        setLastName(names.lastName)
      } catch (loadError) {
        if (!alive) return
        setError(loadError instanceof Error ? formatEdgeFunctionError(loadError) : "Unable to load account status.")
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [usersApi])

  const isPendingCoachLink = Boolean(
    entitlement && entitlement.isLsacLinked && !entitlement.isLsacEligible,
  )
  const paymentRequired = entitlement?.accessState === "PAYMENT_REQUIRED"
  const lsacRequired = entitlement?.accessState === "LSAC_REQUIRED"
  const showCard = !dismissed && !loading && (paymentRequired || lsacRequired)

  useEffect(() => {
    if (!isPendingCoachLink || !usersApi || paymentRequired) return

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
  }, [isPendingCoachLink, paymentRequired, refreshEntitlement, usersApi])

  function validateNames(): boolean {
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required for LawHub registration.")
      return false
    }
    return true
  }

  async function afterLinkAttempt() {
    setStatusMessage("Checking LawHub link status…")
    await refreshEntitlement()
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
      setError(linkError instanceof Error ? formatEdgeFunctionError(linkError) : "Unable to link LawHub account.")
    } finally {
      setIsSubmitting(false)
      setStatusMessage(null)
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
      setError(linkError instanceof Error ? formatEdgeFunctionError(linkError) : "Unable to link LawHub account.")
    } finally {
      setIsSubmitting(false)
      setStatusMessage(null)
    }
  }

  async function handlePendingRefresh() {
    if (!usersApi) return
    setIsRefreshing(true)
    setError(null)
    try {
      await refreshEntitlement()
    } catch (refreshError) {
      setError(
        refreshError instanceof Error ? formatEdgeFunctionError(refreshError) : "Unable to refresh LawHub status.",
      )
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!showCard) return null

  return (
    <section className="dashboard-access-setup rounded-2xl border border-[#dfe1e7] bg-white p-5 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)] sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172b]">
            {paymentRequired ? "Choose a plan to continue" : "Complete LawHub setup"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#62748e]">
            {paymentRequired
              ? "Subscribe to Core or Live to unlock practice, analytics, and LawHub PrepPlus linking."
              : "Link your Official LSAT PrepPlus through LawHub to access Better LSAT."}
          </p>
        </div>
        {!paymentRequired ? (
          <button
            type="button"
            className="shrink-0 text-sm font-medium text-[#62748e] hover:text-[#0f172b]"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </button>
        ) : null}
      </div>

      {checkoutSuccess ? (
        <p className="mb-4 rounded-xl bg-[#ecfdf3] px-3 py-2 text-sm font-medium text-[#067647]">
          Payment successful. Your Better LSAT subscription is active.
        </p>
      ) : null}

      {paymentRequired ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/app/pricing">View plans</Link>
          </Button>
          <p className="text-xs leading-relaxed text-[#62748e]">
            The LawHub fee goes to LSAC. One PrepPlus subscription works across prep platforms.
          </p>
        </div>
      ) : null}

      {!paymentRequired && isPendingCoachLink ? (
        <div className="space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#334155]">
            <li>Check your email from LSAC (same address you used to sign up).</li>
            <li>
              Click <strong>Activate</strong> or <strong>Link to Coach</strong> and sign in to LawHub.
            </li>
            <li>Return here and click the button below.</li>
          </ol>
          <p className="text-xs leading-relaxed text-[#62748e]">
            The LawHub fee goes to LSAC. One PrepPlus subscription works across prep platforms.
          </p>
          <Button
            className="w-full sm:w-auto"
            disabled={isRefreshing || isSubmitting}
            onClick={() => void handlePendingRefresh()}
          >
            {isRefreshing ? "Checking…" : "I've linked my coach"}
          </Button>
        </div>
      ) : null}

      {!paymentRequired && !isPendingCoachLink && lsacRequired ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="dashboard-lsac-first-name" className="mb-1.5 block text-sm font-medium text-[#334155]">
                First name
              </label>
              <Input
                id="dashboard-lsac-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="dashboard-lsac-last-name" className="mb-1.5 block text-sm font-medium text-[#334155]">
                Last name
              </label>
              <Input
                id="dashboard-lsac-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e2e8f0] p-4">
              <h3 className="text-sm font-semibold text-[#0f172b]">PrepPlus included with your plan</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#62748e]">
                Register or link LawHub using the name above and your signup email.
              </p>
              <Button
                className="mt-3 w-full"
                disabled={isSubmitting}
                onClick={() => void completeVendorLawHubLink()}
              >
                {isSubmitting ? "Linking…" : "Complete LawHub setup"}
              </Button>
            </div>
            <div className="rounded-xl border border-[#e2e8f0] p-4">
              <h3 className="text-sm font-semibold text-[#0f172b]">I already have LawHub PrepPlus</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#62748e]">
                Link your existing LawHub account after subscribing to Core or Live.
              </p>
              <Button
                className="mt-3 w-full"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => void linkExistingPrepPlus()}
              >
                {isSubmitting ? "Linking…" : "Link existing PrepPlus"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-[#95122b]">{error}</p> : null}
      {statusMessage && !error ? <p className="mt-3 text-sm text-[#067647]">{statusMessage}</p> : null}
    </section>
  )
}

export { DashboardAccessSetupCard }
