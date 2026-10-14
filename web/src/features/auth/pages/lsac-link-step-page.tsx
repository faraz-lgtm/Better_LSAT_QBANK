import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { createUsersApi, type UserEntitlement, type UserProfile } from "@/lib/api/users"
import { needsLsacSetupStep } from "@/lib/auth/needs-lsac-setup"
import { splitFullName } from "@/lib/lawhub-identity"
import { formatEdgeFunctionError } from "@/lib/supabase/format-call-error"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PENDING_POLL_MS = 15_000
const PENDING_POLL_MAX_MS = 120_000

function LsacLinkStepPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const checkoutSuccess = searchParams.get("checkout") === "success"

  const usersApi = useMemo(() => {
    try {
      return createUsersApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [entitlement, setEntitlement] = useState<UserEntitlement | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const pendingPollStartedAt = useRef<number | null>(null)

  const refreshState = useCallback(async (): Promise<{
    profile: UserProfile | null
    entitlement: UserEntitlement | null
  }> => {
    if (!usersApi) return { profile: null, entitlement: null }
    try {
      await usersApi.lawHubRefresh()
    } catch {
      // Refresh may fail before first invite; entitlement check still applies.
    }
    const [nextProfile, nextEntitlement] = await Promise.all([
      usersApi.getMyProfile(),
      usersApi.getEntitlementState(),
    ])
    setProfile(nextProfile)
    setEntitlement(nextEntitlement)
    if (nextEntitlement?.isLsacEligible && checkoutSuccess) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete("checkout")
      nextParams.delete("session_id")
      setSearchParams(nextParams, { replace: true })
    }
    return { profile: nextProfile, entitlement: nextEntitlement }
  }, [checkoutSuccess, searchParams, setSearchParams, usersApi])

  useEffect(() => {
    let alive = true
    async function bootstrap() {
      if (!usersApi) {
        if (alive) setReady(true)
        return
      }
      try {
        const [nextProfile, nextEntitlement] = await Promise.all([
          usersApi.getMyProfile(),
          usersApi.getEntitlementState(),
        ])
        if (!alive) return
        if (!nextProfile) {
          navigate("/login", { replace: true })
          return
        }
        if (nextEntitlement.isLsacEligible) {
          const checkoutQuery = checkoutSuccess ? "?checkout=success" : ""
          navigate(`/app${checkoutQuery}`, { replace: true })
          return
        }
        if (!nextEntitlement.hasActiveCore) {
          navigate("/app/pricing", { replace: true })
          return
        }
        setProfile(nextProfile)
        setEntitlement(nextEntitlement)
        const fromProfile = {
          firstName: nextProfile.first_name?.trim() ?? "",
          lastName: nextProfile.last_name?.trim() ?? "",
        }
        if (fromProfile.firstName || fromProfile.lastName) {
          setFirstName(fromProfile.firstName)
          setLastName(fromProfile.lastName)
        } else {
          const names = splitFullName(nextProfile.full_name)
          setFirstName(names.firstName)
          setLastName(names.lastName)
        }
        if (nextProfile.student_coaching_id?.trim()) {
          try {
            const url = await usersApi.lawHubConfirmUrl()
            if (alive) setConfirmUrl(url)
          } catch (confirmError) {
            if (alive) {
              setError(
                confirmError instanceof Error
                  ? formatEdgeFunctionError(confirmError)
                  : "Unable to load LawHub activation link.",
              )
            }
          }
        }
      } catch (loadError) {
        if (alive) {
          setError(
            loadError instanceof Error
              ? formatEdgeFunctionError(loadError)
              : "Unable to load LawHub setup.",
          )
        }
      } finally {
        if (alive) setReady(true)
      }
    }
    void bootstrap()
    return () => {
      alive = false
    }
  }, [checkoutSuccess, navigate, usersApi])

  const hasCoachingId = Boolean(profile?.student_coaching_id?.trim())
  const pendingActivation = Boolean(
    entitlement && entitlement.hasActiveCore && entitlement.isLsacLinked && !entitlement.isLsacEligible,
  )
  const needsInvite = Boolean(
    entitlement && entitlement.hasActiveCore && !entitlement.isLsacEligible && !hasCoachingId,
  )

  useEffect(() => {
    if (!pendingActivation || !usersApi) return

    pendingPollStartedAt.current = Date.now()
    const interval = window.setInterval(() => {
      const startedAt = pendingPollStartedAt.current ?? Date.now()
      if (Date.now() - startedAt >= PENDING_POLL_MAX_MS) {
        window.clearInterval(interval)
        return
      }
      void refreshState().then(({ entitlement: next }) => {
        if (next?.isLsacEligible) {
          navigate("/app", { replace: true })
        }
      })
    }, PENDING_POLL_MS)

    return () => window.clearInterval(interval)
  }, [navigate, pendingActivation, refreshState, usersApi])

  function validateNames(): boolean {
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required for LawHub registration.")
      return false
    }
    return true
  }

  async function afterInvite(nextProfile: UserProfile) {
    setProfile(nextProfile)
    try {
      const url = await usersApi!.lawHubConfirmUrl()
      setConfirmUrl(url)
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? formatEdgeFunctionError(confirmError)
          : "Unable to load LawHub activation link.",
      )
    }
    const { entitlement: nextEntitlement } = await refreshState()
    if (nextEntitlement?.isLsacEligible) {
      navigate("/app", { replace: true })
    }
  }

  async function completeVendorLawHubLink() {
    if (!usersApi || !validateNames()) return
    setIsSubmitting(true)
    setError(null)
    setStatusMessage("Connecting your LawHub account…")
    try {
      const nextProfile = await usersApi.lawHubLink({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        path: "vendor",
      })
      await usersApi.lawHubLogLogin()
      await afterInvite(nextProfile)
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
    setStatusMessage("Linking your existing LawHub PrepPlus account…")
    try {
      const nextProfile = await usersApi.lawHubLink({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        path: "existing",
      })
      await usersApi.lawHubLogLogin()
      await afterInvite(nextProfile)
    } catch (linkError) {
      setError(linkError instanceof Error ? formatEdgeFunctionError(linkError) : "Unable to link LawHub account.")
    } finally {
      setIsSubmitting(false)
      setStatusMessage(null)
    }
  }

  async function openActivationLink() {
    setError(null)
    let url = confirmUrl
    if (!url && usersApi) {
      try {
        url = await usersApi.lawHubConfirmUrl()
        setConfirmUrl(url)
      } catch (confirmError) {
        setError(
          confirmError instanceof Error
            ? formatEdgeFunctionError(confirmError)
            : "Unable to load LawHub activation link.",
        )
        return
      }
    }
    if (!url) {
      setError("Activation link is not ready yet. Complete LawHub setup first.")
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
    setStatusMessage("Finish signup or login on LawHub, then return here.")
  }

  async function handlePendingRefresh() {
    if (!usersApi) return
    setIsRefreshing(true)
    setError(null)
    try {
      const { entitlement: next } = await refreshState()
      if (next?.isLsacEligible) {
        navigate("/app", { replace: true })
        return
      }
      setStatusMessage("Still waiting on LawHub. Finish activation, then check again.")
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? formatEdgeFunctionError(refreshError)
          : "Unable to refresh LawHub status.",
      )
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!ready) {
    return (
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading…" />
      </StudentMain>
    )
  }

  if (!usersApi) {
    return (
      <StudentMain>
        <h1 className="text-2xl font-semibold text-[var(--color-student-heading)]">Complete LawHub setup</h1>
        <p className="mt-2 text-sm text-[var(--greyscale-500)]">
          Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </p>
      </StudentMain>
    )
  }

  return (
    <StudentMain>
      <h1 className="text-2xl font-semibold text-[var(--color-student-heading)]">Complete LawHub setup</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--greyscale-500)]">
        Link your Official LSAT PrepPlus through LawHub to unlock PrepTests, drills, and other LSAC content.
      </p>

      {checkoutSuccess ? (
        <p className="mt-4 rounded-xl bg-[var(--explanation-answered-bg)] px-3 py-2 text-sm font-medium text-[var(--explanation-answered)]">
          Payment successful. Your Better LSAT subscription is active.
        </p>
      ) : null}

      {needsInvite ? (
        <div className="mt-6 max-w-3xl space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="lsac-link-first-name" className="mb-1.5 block text-sm font-medium text-[var(--color-student-heading)]">
                First name
              </label>
              <Input
                id="lsac-link-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="lsac-link-last-name" className="mb-1.5 block text-sm font-medium text-[var(--color-student-heading)]">
                Last name
              </label>
              <Input
                id="lsac-link-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--greyscale-100)] bg-white p-4">
              <h2 className="text-sm font-semibold text-[var(--color-student-heading)]">PrepPlus included with your plan</h2>
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
            <div className="rounded-xl border border-[var(--greyscale-100)] bg-white p-4">
              <h2 className="text-sm font-semibold text-[var(--color-student-heading)]">I already have LawHub PrepPlus</h2>
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

      {(pendingActivation || (hasCoachingId && needsLsacSetupStep(entitlement))) && !needsInvite ? (
        <div className="mt-6 max-w-2xl space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--color-student-heading)]">
            <li>
              Click <strong>Activate LawHub</strong> to open LSAC in a new tab.
            </li>
            <li>Sign in or create your LawHub account and accept the coach link.</li>
            <li>Return here — we check automatically, or tap the button below.</li>
          </ol>
          <p className="text-xs leading-relaxed text-[var(--greyscale-500)]">
            The LawHub fee goes to LSAC. One PrepPlus subscription works across prep platforms.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              disabled={isSubmitting || isRefreshing}
              onClick={() => void openActivationLink()}
            >
              Activate LawHub
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              disabled={isRefreshing || isSubmitting}
              onClick={() => void handlePendingRefresh()}
            >
              {isRefreshing ? "Checking…" : "I've finished on LawHub"}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-[#95122b]">{error}</p> : null}
      {statusMessage && !error ? (
        <p className="mt-4 text-sm text-[var(--explanation-answered)]">{statusMessage}</p>
      ) : null}
    </StudentMain>
  )
}

export { LsacLinkStepPage }
