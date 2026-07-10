import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { createBillingApi, type BillingCatalog, type BillingPlanId } from "@/lib/api/billing"
import { createUsersApi } from "@/lib/api/users"
import { logRouteRedirect } from "@/lib/auth/log-route-redirect"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"
import { cn } from "@/lib/utils"

const CORE_FEATURES = [
  "Full question bank — 6,000+ explanations",
  "Official LSAC questions & full-length tests",
  "Section drills & timed practice",
  "Score analytics & performance tracking",
  "Structured course curriculum",
  "Written & video explanations (videos coming soon)",
  "Personalized study plan from diagnostic",
] as const

const LIVE_FEATURES = [
  "Everything in Core, plus:",
  "Live weekly classes with LSAT instructors",
  "Live Q&A and group sessions",
  "Priority support",
  "Live classes launching soon — lock in pricing now",
] as const

const FALLBACK_CATALOG: BillingCatalog = {
  plans: [
    {
      id: "core",
      name: "Core",
      tagline: "Everything you need to improve your score.",
      monthlyUsd: 70,
      dueTodayUsd: 169,
      dueTodayUsdOwnLsac: 70,
    },
    {
      id: "live",
      name: "Live",
      tagline: "For students who want live instruction.",
      monthlyUsd: 129,
      dueTodayUsd: 228,
      dueTodayUsdOwnLsac: 129,
      badge: "Most Comprehensive",
    },
  ],
  lsacYearly: {
    name: "LawHub Advantage",
    description:
      "Official LSAT PrepPlus via LawHub. Fee goes to LSAC, not Better LSAT. Billed once per year.",
    yearlyUsd: 99,
  },
}

const pricingLayoutProps = {
  ctaLabel: "Log In" as const,
  ctaHref: "/login" as const,
  headerVariant: "app" as const,
  contentLayout: "wide" as const,
}

function PricingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const checkoutCanceled = searchParams.get("checkout") === "cancel"

  const [catalog, setCatalog] = useState<BillingCatalog>(FALLBACK_CATALOG)
  const [isLoading, setIsLoading] = useState(true)
  const [checkoutPlan, setCheckoutPlan] = useState<BillingPlanId | null>(null)
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
          logRouteRedirect("/app/pricing", "/app/lsac-link", "LSAC_REQUIRED")
          navigate("/app/lsac-link", { replace: true })
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

  async function startCheckout(plan: BillingPlanId) {
    if (!billingApi) {
      setError("Billing is not available.")
      return
    }
    setCheckoutPlan(plan)
    setError(null)
    try {
      const url = await billingApi.createCheckoutSession(plan, {
        includeLawHub: !existingLsacMode,
      })
      window.location.assign(url)
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error ? formatSupabaseCallError(checkoutError) : "Unable to start checkout."
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

  const corePlan = catalog.plans.find((p) => p.id === "core") ?? FALLBACK_CATALOG.plans[0]!
  const livePlan = catalog.plans.find((p) => p.id === "live") ?? FALLBACK_CATALOG.plans[1]!

  return (
    <AuthLayout {...pricingLayoutProps}>
      <div className="pricing-page">
        <div className="pricing-page__header">
          <h1 className="pricing-page__title">Pricing</h1>
          <p className="pricing-page__subtitle">
            {existingLsacMode
              ? "Choose Core or Live — you keep your own LawHub PrepPlus subscription."
              : "Includes Official LSAT PrepPlus (LawHub Advantage) for year one at checkout."}
          </p>
        </div>

        {checkoutCanceled && (
          <p className="pricing-page__notice">Checkout canceled. Pick a plan to continue.</p>
        )}
        {error && <p className="pricing-page__error">{error}</p>}

        <div className="pricing-page__grid">
          <PricingCard
            plan={corePlan}
            lsacYearlyUsd={catalog.lsacYearly.yearlyUsd}
            dueTodayUsd={existingLsacMode ? corePlan.dueTodayUsdOwnLsac : corePlan.dueTodayUsd}
            includeLawHub={!existingLsacMode}
            features={CORE_FEATURES}
            ctaLabel="Get Core"
            ctaVariant="orange"
            isLoading={checkoutPlan === "core"}
            disabled={checkoutPlan !== null}
            onSelect={() => void startCheckout("core")}
          />
          <PricingCard
            plan={livePlan}
            lsacYearlyUsd={catalog.lsacYearly.yearlyUsd}
            dueTodayUsd={existingLsacMode ? livePlan.dueTodayUsdOwnLsac : livePlan.dueTodayUsd}
            includeLawHub={!existingLsacMode}
            features={LIVE_FEATURES}
            ctaLabel="Get Live"
            ctaVariant="navy"
            highlighted
            isLoading={checkoutPlan === "live"}
            disabled={checkoutPlan !== null}
            onSelect={() => void startCheckout("live")}
          />
        </div>

        <p className="pricing-page__footnote">
          {existingLsacMode ? (
            <>
              ${corePlan.dueTodayUsdOwnLsac} or ${livePlan.dueTodayUsdOwnLsac} due today for your first month. LawHub
              PrepPlus is billed separately through LSAC.
            </>
          ) : (
            <>
              {catalog.lsacYearly.name} (${catalog.lsacYearly.yearlyUsd}/year) is billed once today, then $
              {corePlan.monthlyUsd} or ${livePlan.monthlyUsd}/mo starting next month.
            </>
          )}
        </p>

        <div className="pricing-page__alt-link">
          {existingLsacMode ? (
            <button
              type="button"
              onClick={() => setExistingLsacMode(false)}
            >
              Need LawHub PrepPlus included? View standard pricing
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setExistingLsacMode(true)}
            >
              I already have LawHub PrepPlus — pay for Core or Live only
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}

function PricingCard({
  plan,
  lsacYearlyUsd,
  dueTodayUsd,
  includeLawHub,
  features,
  ctaLabel,
  ctaVariant,
  highlighted = false,
  isLoading,
  disabled,
  onSelect,
}: {
  plan: BillingCatalog["plans"][number]
  lsacYearlyUsd: number
  dueTodayUsd: number
  includeLawHub: boolean
  features: readonly string[]
  ctaLabel: string
  ctaVariant: "orange" | "navy"
  highlighted?: boolean
  isLoading: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={cn(
        "pricing-card",
        highlighted && "pricing-card--highlighted",
      )}
    >
      {plan.badge && <span className="pricing-card__badge">{plan.badge}</span>}
      <h2 className="pricing-card__name">{plan.name}</h2>
      <p className="pricing-card__tagline">{plan.tagline}</p>
      <p className="pricing-card__price">
        ${plan.monthlyUsd}
        <span>/month</span>
      </p>
      <p className="pricing-card__due-today">
        {includeLawHub
          ? `$${dueTodayUsd} due today (incl. $${lsacYearlyUsd} LawHub Advantage)`
          : `$${dueTodayUsd} due today`}
      </p>
      <ul className="pricing-card__features">
        {features.map((feature) => (
          <li key={feature}>
            <Check className="pricing-card__check" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        className={cn(
          "pricing-card__cta",
          ctaVariant === "orange" ? "pricing-card__cta--orange" : "pricing-card__cta--navy",
        )}
        disabled={disabled}
        onClick={onSelect}
      >
        {isLoading ? "Redirecting…" : ctaLabel}
        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  )
}

export { PricingPage }
