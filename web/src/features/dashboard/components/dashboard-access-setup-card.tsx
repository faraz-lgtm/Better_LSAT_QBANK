import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { useStudentEntitlement } from "@/features/app-shell/student-entitlement-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { createUsersApi } from "@/lib/api/users"
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
  const { openPricingModal } = useGuestPricingModal()
  const checkoutSuccess = searchParams.get("checkout") === "success"
  const {
    entitlement,
    loading: entitlementLoading,
    canAccessLsacContent,
    isPaymentRequired,
    refresh,
  } = useStudentEntitlement()

  const usersApi = useMemo(() => {
    try {
      return createUsersApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [namesLoaded, setNamesLoaded] = useState(false)
  const pendingPollStartedAt = useRef<number | null>(null)

  useEffect(() => {
    let alive = true
    async function loadNames() {
      if (!usersApi) {
        if (alive) setNamesLoaded(true)
        return
      }
      try {
        const profile = await usersApi.getMyProfile()
        if (!alive) return
        const names = splitFullName(profile?.full_name)
        setFirstName(names.firstName)
        setLastName(names.lastName)
      } catch {
        // Names stay empty; user can type them.
      } finally {
        if (alive) setNamesLoaded(true)
      }
    }
    void loadNames()
    return () => {
      alive = false
    }
  }, [usersApi])

  const isPendingCoachLink = Boolean(
    entitlement && entitlement.isLsacLinked && !entitlement.isLsacEligible,
  )
  const showCard = !entitlementLoading && !canAccessLsacContent

  const refreshEntitlement = useCallback(async () => {
    if (!usersApi) return null
    try {
      await usersApi.lawHubRefresh()
    } catch {
      // Refresh may fail before first link; entitlement check still applies.
    }
    const next = await refresh()
    if (next?.isLsacEligible && checkoutSuccess) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete("checkout")
      setSearchParams(nextParams, { replace: true })
    }
    return next
  }, [checkoutSuccess, refresh, searchParams, setSearchParams, usersApi])

  useEffect(() => {
    if (!isPendingCoachLink || !usersApi || isPaymentRequired) return

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
  }, [isPendingCoachLink, isPaymentRequired, refreshEntitlement, usersApi])

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

  if (!showCard || !namesLoaded) return null

  return (
    <section className="dashboard-access-setup rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-5 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)] sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--color-student-heading)]">
          {isPaymentRequired ? "Choose a plan to continue" : "Complete LawHub setup"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--greyscale-500)]">
          {isPaymentRequired
            ? "Subscribe to Core or Live to unlock practice, analytics, and LawHub PrepPlus linking."
            : "Link your Official LSAT PrepPlus through LawHub to unlock PrepTests, drills, and other LSAC content."}
        </p>
      </div>

      {checkoutSuccess ? (
        <p className="mb-4 rounded-xl bg-[var(--explanation-answered-bg)] px-3 py-2 text-sm font-medium text-[var(--explanation-answered)]">
          Payment successful. Your Better LSAT subscription is active.
        </p>
      ) : null}

      {isPaymentRequired ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="button" className="w-full sm:w-auto" onClick={openPricingModal}>
            View plans
          </Button>
          <p className="text-xs leading-relaxed text-[var(--greyscale-500)]">
            The LawHub fee goes to LSAC. One PrepPlus subscription works across prep platforms.
          </p>
        </div>
      ) : null}

      {!isPaymentRequired && isPendingCoachLink ? (
        <div className="space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--color-student-heading)]">
            <li>Check your email from LSAC (same address you used to sign up).</li>
            <li>
              Click <strong>Activate</strong> or <strong>Link to Coach</strong> and sign in to LawHub.
            </li>
            <li>Return here and click the button below.</li>
          </ol>
          <p className="text-xs leading-relaxed text-[var(--greyscale-500)]">
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

      {!isPaymentRequired && !isPendingCoachLink ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="dashboard-lsac-first-name" className="mb-1.5 block text-sm font-medium text-[var(--color-student-heading)]">
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
              <label htmlFor="dashboard-lsac-last-name" className="mb-1.5 block text-sm font-medium text-[var(--color-student-heading)]">
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
            <div className="rounded-xl border border-[var(--greyscale-100)] p-4">
              <h3 className="text-sm font-semibold text-[var(--color-student-heading)]">PrepPlus included with your plan</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--greyscale-500)]">
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
            <div className="rounded-xl border border-[var(--greyscale-100)] p-4">
              <h3 className="text-sm font-semibold text-[var(--color-student-heading)]">I already have LawHub PrepPlus</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--greyscale-500)]">
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
      {statusMessage && !error ? <p className="mt-3 text-sm text-[var(--explanation-answered)]">{statusMessage}</p> : null}
    </section>
  )
}

export { DashboardAccessSetupCard }
