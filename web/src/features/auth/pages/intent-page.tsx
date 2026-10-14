import { useLayoutEffect, useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import {
  DiagnosticIntentCard,
  type DiagnosticIntentTierConfig,
} from "@/features/auth/components/diagnostic-intent-card"
import { STUDENT_DASHBOARD_HREF } from "@/features/app-shell/student-nav-config"
import {
  GuestPricingModalProvider,
  useGuestPricingModal,
} from "@/features/guest/pricing/guest-pricing-modal-provider"
import { AnalyticsEvent, captureEvent } from "@/lib/analytics/posthog"
import {
  saveDiagnosticIntent,
  type DiagnosticIntentTier,
} from "@/lib/auth/diagnostic-intent"

/** Public marketing site (apex); guests leave the app subdomain via Back. */
const MARKETING_SITE_HREF = "https://betterlsat.com"

const DIAGNOSTIC_TIERS: DiagnosticIntentTierConfig[] = [
  {
    id: "mini",
    name: "Quick Baseline",
    tagline: "Quick overview of your weakest areas",
    questions: "10q",
    duration: "~13 min",
    features: ["5 questions per section", "Basic score estimate", "Quick topic flags"],
    accent: "mini",
  },
  {
    id: "quick",
    name: "Full Section",
    tagline: "Find your biggest point leaks fast",
    questions: "25q",
    duration: "~35 min",
    features: ["All 4 sections covered", "Detailed score breakdown", "Point leak map"],
    accent: "quick",
    recommended: true,
  },
]

const TIER_LABELS: Record<DiagnosticIntentTier, string> = {
  mini: "Quick Baseline",
  quick: "Full Section",
  full: "Full Section",
}

const INTENT_PAGE_DISCLAIMER = [
  "BetterLSAT is an independent test-preparation company and is not affiliated with or endorsed by LSAC. Official LSAT® content is used under licence and is available only to students with an active subscription. All BetterLSAT practice questions, including our free diagnostics, are original works written by our instructors — they are not LSAT questions and are not derived from LSAT content.",
  "All actual LSAT® content reproduced within this work is used with the permission of Law School Admission Council, Inc., the copyright owner. LSAC does not review or endorse specific test-preparation materials, companies, or services, and inclusion of Licensor Content within this work does not imply the review or endorsement of LSAC. LSAT (including variations) and LSAC are registered trademarks of LSAC.",
] as const

function intentNavigationState(tier: DiagnosticIntentTier) {
  return { from: "intent" as const, intent: tier }
}

type IntentPageProps = {
  isAuthenticated?: boolean
  /** When false, hide header Upgrade CTA (paid / premium accounts). Defaults to true. */
  showUpgradeCta?: boolean
  /**
   * Authenticated first-time users must finish welcome onboarding (name/password)
   * before the exam — common after email magic-link when intent storage was lost.
   */
  requiresOnboarding?: boolean
}

function IntentPage({
  isAuthenticated = false,
  showUpgradeCta = true,
  requiresOnboarding = false,
}: IntentPageProps) {
  if (isAuthenticated) {
    return (
      <GuestPricingModalProvider authenticatedCheckout>
        <IntentPageContent
          isAuthenticated
          showUpgradeCta={showUpgradeCta}
          requiresOnboarding={requiresOnboarding}
        />
      </GuestPricingModalProvider>
    )
  }

  return <IntentPageContent isAuthenticated={false} showUpgradeCta={showUpgradeCta} />
}

function IntentPageContent({
  isAuthenticated = false,
  showUpgradeCta = true,
  requiresOnboarding = false,
}: IntentPageProps) {
  const navigate = useNavigate()
  const { openPricingModal } = useGuestPricingModal()
  const [selectedTier, setSelectedTier] = useState<DiagnosticIntentTier>("quick")

  useLayoutEffect(() => {
    document.documentElement.classList.add("intent-mobile-layout")
    return () => document.documentElement.classList.remove("intent-mobile-layout")
  }, [])

  function handleStart() {
    saveDiagnosticIntent(selectedTier)
    captureEvent(AnalyticsEvent.intentSelected, { intent: selectedTier })
    if (isAuthenticated) {
      if (requiresOnboarding) {
        navigate("/onboarding", { replace: true })
        return
      }
      navigate(`/diagnostic/start?intent=${selectedTier}`, { replace: true })
      return
    }
    navigate("/signup", { state: intentNavigationState(selectedTier) })
  }

  return (
    <AuthLayout
      headerVariant="intent"
      contentLayout="intent"
      hideSidebar
      hideIntentSignIn={isAuthenticated}
      hideIntentUpgrade={!showUpgradeCta}
      onIntentUpgrade={isAuthenticated && showUpgradeCta ? openPricingModal : undefined}
    >
      <div className="intent-page">
        <AuthCard className="intent-page__card">
          {isAuthenticated ? (
            <Link to={STUDENT_DASHBOARD_HREF} className="intent-page__back">
              <ArrowLeft className="intent-page__back-icon" aria-hidden />
              Back
            </Link>
          ) : (
            <a href={MARKETING_SITE_HREF} className="intent-page__back">
              <ArrowLeft className="intent-page__back-icon" aria-hidden />
              Back
            </a>
          )}
          <div className="intent-page__header">
            <h1 className="intent-page__title">Take diagnostic</h1>
            <p className="intent-page__subtitle">
              Choose the length that fits your schedule. All tiers are free to start.
            </p>
          </div>

          <div className="intent-page__grid" role="radiogroup" aria-label="Diagnostic tier">
            {DIAGNOSTIC_TIERS.map((tier) => (
              <DiagnosticIntentCard
                key={tier.id}
                tier={tier}
                selected={selectedTier === tier.id}
                onSelect={() => setSelectedTier(tier.id)}
              />
            ))}
          </div>

          <div className="intent-page__cta-wrap">
            <Button type="button" className="intent-page__cta" onClick={handleStart}>
              Start {TIER_LABELS[selectedTier]}
              <ArrowRight className="intent-page__cta-icon" aria-hidden />
            </Button>
            {!isAuthenticated ? (
              <p className="intent-page__sign-in-prompt">
                Already have an account?{" "}
                <Link
                  to="/login"
                  state={intentNavigationState(selectedTier)}
                  className="font-semibold text-[var(--primary)]"
                  onClick={() => saveDiagnosticIntent(selectedTier)}
                >
                  Sign in
                </Link>
              </p>
            ) : null}
          </div>

          <div className="intent-page__disclaimer">
            {INTENT_PAGE_DISCLAIMER.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </AuthCard>
      </div>
    </AuthLayout>
  )
}

export { IntentPage, intentNavigationState }
