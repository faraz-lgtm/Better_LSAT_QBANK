import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { pollEntitlementAfterCheckoutSuccess } from "@/features/app-shell/poll-entitlement-after-checkout"
import { useStudentEntitlementOptional } from "@/features/app-shell/student-entitlement-context"
import { CheckoutPaymentSuccessDialog } from "@/features/billing/components/checkout-payment-success-dialog"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { createUsersApi, type UserEntitlement, type UserProfile } from "@/lib/api/users"
import { markLawHubLoginLoggedThisSession } from "@/lib/auth/lawhub-session-log"
import { needsLsacSetupStep } from "@/lib/auth/needs-lsac-setup"
import { splitFullName } from "@/lib/lawhub-identity"
import { formatEdgeFunctionError } from "@/lib/supabase/format-call-error"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PENDING_POLL_MS = 15_000
const PENDING_POLL_MAX_MS = 120_000
const LINKED_HARD_REFRESH_MS = 10_000

function LsacLinkStepPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const checkoutSuccess = searchParams.get("checkout") === "success"
  const previewParam = searchParams.get("preview")
  const previewInvite = previewParam === "invite"
  const previewPending = previewParam === "1" || previewParam === "pending"
  const isUiPreview = previewInvite || previewPending
  const entitlementCtx = useStudentEntitlementOptional()
  const { openPricingModal } = useGuestPricingModal()

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
  const [linkedSuccessOpen, setLinkedSuccessOpen] = useState(false)
  const pendingPollStartedAt = useRef<number | null>(null)
  const linkedRefreshTimerRef = useRef<number | null>(null)
  const linkedSuccessScheduledRef = useRef(false)

  const announceLinkedAndHardRefresh = useCallback(() => {
    if (linkedSuccessScheduledRef.current) return
    linkedSuccessScheduledRef.current = true
    setLinkedSuccessOpen(true)
    linkedRefreshTimerRef.current = window.setTimeout(() => {
      window.location.assign("/app")
    }, LINKED_HARD_REFRESH_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (linkedRefreshTimerRef.current != null) {
        window.clearTimeout(linkedRefreshTimerRef.current)
      }
    }
  }, [])

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
    const abortController = new AbortController()
    async function bootstrap() {
      if (!usersApi) {
        if (alive) setReady(true)
        return
      }
      try {
        const nextProfile = await usersApi.getMyProfile()
        if (!alive) return
        if (!nextProfile) {
          navigate("/login", { replace: true })
          return
        }

        let nextEntitlement = await usersApi.getEntitlementState()
        if (!alive) return

        if (!nextEntitlement.hasActiveCore && checkoutSuccess) {
          const synced = await pollEntitlementAfterCheckoutSuccess(
            new URLSearchParams("checkout=success"),
            {
              getEntitlement: () => usersApi.getEntitlementState(),
              refresh: async () => {
                if (entitlementCtx) return entitlementCtx.refresh()
                return usersApi.getEntitlementState()
              },
              currentEntitlement: nextEntitlement,
              signal: abortController.signal,
            },
          )
          if (!alive) return
          if (synced) {
            nextEntitlement = await usersApi.getEntitlementState()
            if (!alive) return
          }
        }

        if (!isUiPreview && nextEntitlement.isLsacEligible) {
          const checkoutQuery = checkoutSuccess ? "?checkout=success" : ""
          navigate(`/app${checkoutQuery}`, { replace: true })
          return
        }
        if (!isUiPreview && !nextEntitlement.hasActiveCore) {
          openPricingModal()
          navigate("/app", { replace: true })
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
        if (isUiPreview && previewPending) {
          if (alive) setConfirmUrl("https://example.com/lawhub-preview")
        } else if (nextProfile.student_coaching_id?.trim()) {
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
      abortController.abort()
    }
    // entitlementCtx is read for refresh only; do not re-bootstrap when shell entitlement updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount/checkout-success bootstrap
  }, [checkoutSuccess, isUiPreview, navigate, openPricingModal, previewPending, usersApi])

  const hasCoachingId = Boolean(profile?.student_coaching_id?.trim())
  const pendingActivation = Boolean(
    entitlement && entitlement.hasActiveCore && entitlement.isLsacLinked && !entitlement.isLsacEligible,
  )
  const needsInvite = previewInvite
    ? true
    : previewPending
      ? false
      : Boolean(entitlement && entitlement.hasActiveCore && !entitlement.isLsacEligible && !hasCoachingId)
  const showPendingActivation = previewPending
    ? true
    : previewInvite
      ? false
      : (pendingActivation || (hasCoachingId && needsLsacSetupStep(entitlement))) && !needsInvite

  useEffect(() => {
    if (isUiPreview || !pendingActivation || !usersApi) return

    pendingPollStartedAt.current = Date.now()
    const interval = window.setInterval(() => {
      const startedAt = pendingPollStartedAt.current ?? Date.now()
      if (Date.now() - startedAt >= PENDING_POLL_MAX_MS) {
        window.clearInterval(interval)
        return
      }
      void refreshState().then(({ entitlement: next }) => {
        if (next?.isLsacEligible) {
          window.clearInterval(interval)
          announceLinkedAndHardRefresh()
        }
      })
    }, PENDING_POLL_MS)

    return () => window.clearInterval(interval)
  }, [announceLinkedAndHardRefresh, pendingActivation, refreshState, usersApi])

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
      announceLinkedAndHardRefresh()
    }
  }

  async function completeVendorLawHubLink() {
    if (!usersApi || !validateNames()) return
    setIsSubmitting(true)
    setError(null)
    setStatusMessage("Setting up LawHub with PrepPlus from your plan…")
    try {
      const nextProfile = await usersApi.lawHubLink({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        path: "vendor",
      })
      await usersApi.lawHubLogLogin()
      markLawHubLoginLoggedThisSession()
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
    setStatusMessage("Linking your existing PrepPlus — use the same email on LawHub…")
    try {
      const nextProfile = await usersApi.lawHubLink({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        path: "existing",
      })
      await usersApi.lawHubLogLogin()
      markLawHubLoginLoggedThisSession()
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
        announceLinkedAndHardRefresh()
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
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-[var(--color-student-heading)]">Complete LawHub setup</h1>
          <p className="mt-2 text-sm text-[var(--greyscale-500)]">
            Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
          </p>
        </div>
      </StudentMain>
    )
  }

  return (
    <StudentMain>
      <CheckoutPaymentSuccessDialog confirmLabel="Continue to LawHub setup" />
      <DialogRoot open={linkedSuccessOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          aria-describedby="lsac-linked-success-desc"
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>You&apos;re linked</DialogTitle>
            <DialogDescription id="lsac-linked-success-desc">
              Your LawHub account is connected. We&apos;ll refresh the app in a few seconds so your
              PrepPlus access is ready.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </DialogRoot>
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-8 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
        <div className="border-b border-[var(--greyscale-100)] pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--greyscale-500)]">
            {needsInvite ? "Step 1 of 2" : showPendingActivation ? "Step 2 of 2" : "LawHub"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-student-heading)]">
            Complete LawHub setup
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--greyscale-500)]">
            {needsInvite
              ? "Choose one path. Both use your Better LSAT signup email and the name below. Next you’ll open LawHub to accept Better LSAT as your coach."
              : "Link your Official LSAT PrepPlus through LawHub to unlock PrepTests, drills, and other LSAC content."}
          </p>
        </div>

        {needsInvite ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="lsac-link-first-name"
                  className="mb-1.5 block text-sm font-medium text-[var(--color-student-heading)]"
                >
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
                <label
                  htmlFor="lsac-link-last-name"
                  className="mb-1.5 block text-sm font-medium text-[var(--color-student-heading)]"
                >
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
              <div className="relative rounded-xl border-2 border-[var(--color-student-heading)]/15 bg-[var(--greyscale-25)] p-4">
                <span className="absolute -top-2.5 left-3 rounded-md bg-[var(--color-student-heading)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--greyscale-0)]">
                  Recommended
                </span>
                <h2 className="text-sm font-semibold text-[var(--color-student-heading)]">
                  PrepPlus included with your plan
                </h2>
                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-[var(--greyscale-500)]">
                  <li>Click the button to create your LawHub coach invite (PrepPlus comes with your plan).</li>
                  <li>
                    On the next screen, open{" "}
                    <strong className="font-semibold text-[var(--color-student-heading)]">Activate LawHub</strong>.
                  </li>
                  <li>
                    Create or sign in on LawHub with{" "}
                    <strong className="font-semibold text-[var(--color-student-heading)]">this same email</strong>, then
                    accept the coach link.
                  </li>
                </ol>
                <Button
                  className="mt-4 w-full"
                  disabled={isSubmitting}
                  onClick={() => void completeVendorLawHubLink()}
                >
                  {isSubmitting ? "Setting up…" : "Set up LawHub with my plan"}
                </Button>
              </div>
              <div className="rounded-xl border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] p-4">
                <h2 className="text-sm font-semibold text-[var(--color-student-heading)]">
                  I already have LawHub PrepPlus
                </h2>
                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-[var(--greyscale-500)]">
                  <li>Click only if you already pay LSAC for PrepPlus.</li>
                  <li>
                    Your LawHub account must use the{" "}
                    <strong className="font-semibold text-[var(--color-student-heading)]">same email</strong> as Better
                    LSAT.
                  </li>
                  <li>
                    We’ll invite you as coach (we won’t sell you another PrepPlus). Then{" "}
                    <strong className="font-semibold text-[var(--color-student-heading)]">Activate LawHub</strong> → sign
                    into your existing account → accept the coach.
                  </li>
                </ol>
                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => void linkExistingPrepPlus()}
                >
                  {isSubmitting ? "Linking…" : "Link my existing PrepPlus"}
                </Button>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[var(--greyscale-500)]">
              LSAC may also email you; you can ignore it if you use Activate LawHub here.
            </p>
          </div>
        ) : null}

        {showPendingActivation ? (
          <div className="mt-6">
            <p className="text-sm font-medium text-[var(--color-student-heading)]">
              Coach invite created. Finish on LawHub:
            </p>
            <ol className="m-0 mt-4 list-none space-y-3.5 p-0">
              <li className="flex gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-student-heading)] text-xs font-bold text-[var(--greyscale-0)]"
                  aria-hidden
                >
                  1
                </span>
                <span className="min-w-0 pt-0.5 text-sm leading-relaxed text-[var(--color-student-heading)]">
                  Click <strong>Activate LawHub</strong> to open LSAC in a new tab.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-student-heading)] text-xs font-bold text-[var(--greyscale-0)]"
                  aria-hidden
                >
                  2
                </span>
                <span className="min-w-0 pt-0.5 text-sm leading-relaxed text-[var(--color-student-heading)]">
                  Sign in or create your LawHub account and accept the coach link.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-student-heading)] text-xs font-bold text-[var(--greyscale-0)]"
                  aria-hidden
                >
                  3
                </span>
                <span className="min-w-0 pt-0.5 text-sm leading-relaxed text-[var(--color-student-heading)]">
                  Return here — we check automatically, or tap the button below.
                </span>
              </li>
            </ol>
            <p className="mt-6 pl-10 text-xs leading-relaxed text-[var(--greyscale-500)]">
              The LawHub fee goes to LSAC. One PrepPlus subscription works across prep platforms.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <Button
                className="w-full sm:min-w-0 sm:flex-1"
                disabled={isSubmitting || isRefreshing}
                onClick={() => void openActivationLink()}
              >
                Activate LawHub
              </Button>
              <Button
                className="w-full sm:min-w-0 sm:flex-1"
                variant="outline"
                disabled={isRefreshing || isSubmitting}
                onClick={() => void handlePendingRefresh()}
              >
                {isRefreshing ? "Checking…" : "I've finished on LawHub"}
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p
            className="mt-5 rounded-lg border border-[#f1c4cd] bg-[#fff5f7] px-3 py-2.5 text-sm text-[#95122b] dark:border-[#5c2a35] dark:bg-[#3a2228] dark:text-[#ffb3c0]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {statusMessage && !error ? (
          <p className="mt-5 rounded-lg border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 py-2.5 text-sm text-[var(--explanation-answered)]">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </StudentMain>
  )
}

export { LsacLinkStepPage }
