import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { PricingPlanCard } from "@/features/billing/pricing-plan-card"
import {
  FREE_PRICING_PLAN,
  PAID_PRICING_PLANS,
  type PaidPricingPlan,
} from "@/features/guest/pricing/guest-pricing-plans-data"
import {
  LAWHUB_ADVANTAGE_BILLING_NOTE,
  LAWHUB_OWN_PREPPLUS_NOTE,
} from "@/features/guest/pricing/guest-pricing-lawhub"
import { createBillingApi, type BillingCatalog, type CheckoutPlanId } from "@/lib/api/billing"
import { createUsersApi } from "@/lib/api/users"
import { logRouteRedirect } from "@/lib/auth/log-route-redirect"
import { isInDiagnosticAcquisitionFunnel, readDiagnosticFunnelState } from "@/lib/auth/diagnostic-intent"
import { emailAllowsLawHub, profileHasLawHubName } from "@/lib/lawhub-identity"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatEdgeFunctionError, formatSupabaseCallError } from "@/lib/supabase/format-call-error"

const pricingLayoutProps = {
  ctaLabel: "Log In" as const,
  ctaHref: "/login" as const,
  headerVariant: "app" as const,
  contentLayout: "wide" as const,
}

function mergePaidPlan(plan: PaidPricingPlan, catalog: BillingCatalog | null): PaidPricingPlan {
  const remote = catalog?.plans.find((item) => item.id === plan.id)
  if (!remote) return plan
  return {
    ...plan,
    name: remote.name,
    headline: remote.headline,
    description: remote.description,
    priceUsd: remote.priceUsd,
    equivalentMonthlyUsd: remote.equivalentMonthlyUsd,
    discountLabel: remote.discountLabel,
    badge: plan.badge,
    renewalNote: remote.renewalNote,
  }
}

function PricingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const checkoutCanceled = searchParams.get("checkout") === "cancel"

  const [catalog, setCatalog] = useState<BillingCatalog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkoutPlan, setCheckoutPlan] = useState<CheckoutPlanId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [existingLsacMode, setExistingLsacMode] = useState(false)

  const billingApi = useMemo(() => {
    try {
      return createBillingApi(getSupabaseBrowserClient())
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
    let alive = true
    async function load() {
      if (isInDiagnosticAcquisitionFunnel()) {
        logRouteRedirect("/app/pricing", "/diagnostic/start", "diagnostic acquisition funnel")
        navigate("/diagnostic/start", { replace: true })
        return
      }
      if (!usersApi) {
        if (alive) {
          setError("Supabase env is missing.")
          setIsLoading(false)
        }
        return
      }
      try {
        const profile = await usersApi.getMyProfile()
        if (!alive) return
        if (!profile) {
          logRouteRedirect("/app/pricing", "/login", "no profile on load")
          navigate("/login", { replace: true })
          return
        }

        const entitlement = await usersApi.getEntitlementState()
        if (!alive) return

        if (entitlement.accessState === "FULL_ACCESS") {
          logRouteRedirect("/app/pricing", "/app", "FULL_ACCESS")
          navigate("/app", { replace: true })
          return
        }
        if (entitlement.accessState === "LSAC_REQUIRED") {
          logRouteRedirect("/app/pricing", "/app", "LSAC_REQUIRED; soft-gate on dashboard")
          navigate("/app", { replace: true })
          return
        }

        if (billingApi) {
          try {
            const nextCatalog = await billingApi.getPlans()
            if (!alive) return
            setCatalog(nextCatalog)
          } catch (billingError) {
            if (!alive) return
            logRouteRedirect("/app/pricing", "/app/pricing", "billing load failed; staying on pricing", {
              error: billingError instanceof Error ? billingError.message : String(billingError),
            })
          }
        }
      } catch (loadError) {
        if (!alive) return
        setError(loadError instanceof Error ? formatSupabaseCallError(loadError) : "Unable to load pricing.")
      } finally {
        if (alive) setIsLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [billingApi, navigate, usersApi])

  async function startCheckout(plan: CheckoutPlanId) {
    if (!billingApi) {
      setError("Billing is not available.")
      return
    }
    if (usersApi) {
      const profile = await usersApi.getMyProfile()
      if (!emailAllowsLawHub(profile?.email)) {
        setError(
          'Your email uses a "+" tag, which LSAC does not allow. Update your account email before checkout.',
        )
        return
      }
      if (!profileHasLawHubName(profile)) {
        logRouteRedirect("/app/pricing", "/onboarding", "missing LawHub first/last name before checkout")
        navigate("/onboarding", { replace: true })
        return
      }
    }
    setCheckoutPlan(plan)
    setError(null)
    try {
      const funnel = readDiagnosticFunnelState()
      const successPath = funnel.completedDiagnostic
        ? '/app/diagnostic/results?checkout=success'
        : undefined
      const url = await billingApi.createCheckoutSession(plan, {
        includeLawHub: !existingLsacMode,
        successPath,
      })
      window.location.assign(url)
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? formatEdgeFunctionError(checkoutError)
          : "Unable to start checkout."
      if (message.includes("First and last name") || message.includes("LAWHUB_NAME")) {
        logRouteRedirect("/app/pricing", "/onboarding", "server rejected checkout: name required")
        navigate("/onboarding", { replace: true })
        return
      }
      setError(message.includes("not configured") ? "Billing is not configured on the server." : message)
      setCheckoutPlan(null)
    }
  }

  if (isLoading) {
    return (
      <AuthLayout {...pricingLayoutProps}>
        <StudentPageLoader centered label="Loading plans…" />
      </AuthLayout>
    )
  }

  const paidPlans = PAID_PRICING_PLANS.map((plan) => mergePaidPlan(plan, catalog))

  return (
    <AuthLayout {...pricingLayoutProps}>
      <div className="pricing-page">
        <div className="pricing-page__header">
          <h1 className="pricing-page__title">Pricing</h1>
          <p className="pricing-page__subtitle">
            {existingLsacMode
              ? "Choose a Core plan — you keep your own LawHub PrepPlus subscription."
              : "Core plans include Official LSAT PrepPlus (LawHub Advantage) for year one at checkout."}
          </p>
        </div>

        {checkoutCanceled && (
          <p className="pricing-page__notice">Checkout canceled. Pick a plan to continue.</p>
        )}
        {error && <p className="pricing-page__error">{error}</p>}

        <div className="pricing-page__grid">
          <PricingPlanCard
            plan={{ ...FREE_PRICING_PLAN, ctaLabel: "Continue Free" }}
            ctaVariant="orange"
            disabled={checkoutPlan !== null}
            onSelect={() => navigate("/app")}
          />
          {paidPlans.map((plan) => (
            <PricingPlanCard
              key={plan.id}
              plan={plan}
              includeLawHub={!existingLsacMode}
              highlighted={plan.featured}
              ctaVariant={plan.id === "monthly" ? "orange" : "navy"}
              isLoading={checkoutPlan === plan.id}
              disabled={checkoutPlan !== null}
              onSelect={() => void startCheckout(plan.id)}
            />
          ))}
        </div>

        <p className="pricing-page__footnote">
          {existingLsacMode ? LAWHUB_OWN_PREPPLUS_NOTE : LAWHUB_ADVANTAGE_BILLING_NOTE}
        </p>

        <div className="pricing-page__alt-link">
          {existingLsacMode ? (
            <button type="button" onClick={() => setExistingLsacMode(false)}>
              Need LawHub PrepPlus included? View standard pricing
            </button>
          ) : (
            <button type="button" onClick={() => setExistingLsacMode(true)}>
              I already have LawHub PrepPlus — pay for Core only
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}

export { PricingPage }
