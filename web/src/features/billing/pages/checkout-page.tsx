import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { createBillingApi, type CheckoutPlanId } from "@/lib/api/billing"
import { createUsersApi } from "@/lib/api/users"
import {
  clearPendingCheckoutPlan,
  parseSignupPlan,
} from "@/lib/auth/pending-checkout-plan"
import { profileHasLawHubName } from "@/lib/lawhub-identity"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  formatEdgeFunctionError,
  formatSupabaseCallError,
} from "@/lib/supabase/format-call-error"

function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parsedPlan = parseSignupPlan(searchParams.get("plan"))
  const plan: CheckoutPlanId | null =
    parsedPlan && parsedPlan !== "free" ? parsedPlan : null
  const checkoutCanceled = searchParams.get("checkout") === "cancel"
  const [isLoading, setIsLoading] = useState(!checkoutCanceled)
  const [error, setError] = useState<string | null>(
    plan ? null : "This checkout plan is not available.",
  )
  const checkoutLockRef = useRef(false)

  const apis = useMemo(() => {
    try {
      const supabase = getSupabaseBrowserClient()
      return {
        billing: createBillingApi(supabase),
        users: createUsersApi(supabase),
      }
    } catch {
      return null
    }
  }, [])

  const startCheckout = useCallback(async () => {
    if (!plan || checkoutLockRef.current) return
    if (!apis) {
      setError("Billing is not available.")
      setIsLoading(false)
      return
    }

    checkoutLockRef.current = true
    setIsLoading(true)
    setError(null)
    try {
      const profile = await apis.users.getMyProfile()
      if (!profile) {
        navigate(`/checkout/details?plan=${plan}`, { replace: true })
        return
      }
      if (!profileHasLawHubName(profile)) {
        navigate(`/checkout/details?plan=${plan}`, { replace: true })
        return
      }
      const url = await apis.billing.createCheckoutSession(plan, {
        includeLawHub: true,
        successPath: "/onboarding?checkout=success",
      })
      clearPendingCheckoutPlan()
      window.location.assign(url)
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? formatEdgeFunctionError(checkoutError)
          : "Unable to start checkout."
      if (message.includes("First and last name") || message.includes("LAWHUB_NAME")) {
        navigate(`/checkout/details?plan=${plan}`, { replace: true })
        return
      }
      setError(
        message.includes("not configured")
          ? "Billing is not configured on the server."
          : formatSupabaseCallError(new Error(message)),
      )
      checkoutLockRef.current = false
      setIsLoading(false)
    }
  }, [apis, navigate, plan])

  useEffect(() => {
    if (checkoutCanceled || !plan) {
      setIsLoading(false)
      return
    }
    void startCheckout()
  }, [checkoutCanceled, plan, startCheckout])

  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--primary-0)] px-4 py-10">
      <AuthCard className="w-full max-w-md text-center">
        <div className="flex flex-col items-center gap-5">
          <h1 className="text-2xl font-bold text-[#062357]">
            {checkoutCanceled ? "Checkout canceled" : "Secure checkout"}
          </h1>

          {isLoading ? (
            <StudentPageLoader centered label="Taking you to checkout…" />
          ) : null}

          {checkoutCanceled ? (
            <p className="text-sm text-[#666d80]">
              Your plan is still selected. Continue when you are ready.
            </p>
          ) : null}

          {error ? (
            <p className="text-sm text-[#df1c41]" role="alert">
              {error}
            </p>
          ) : null}

          {!isLoading && plan ? (
            <Button type="button" className="ds-btn w-full" onClick={() => void startCheckout()}>
              Continue to checkout
            </Button>
          ) : null}

          {!isLoading ? (
            <Link to="/app" className="text-sm font-semibold text-[#0d47a1] hover:underline">
              Return to BetterLSAT
            </Link>
          ) : null}
        </div>
      </AuthCard>
    </main>
  )
}

export { CheckoutPage }
