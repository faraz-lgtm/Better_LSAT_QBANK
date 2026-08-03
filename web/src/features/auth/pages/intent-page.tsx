import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import {
  DiagnosticIntentCard,
  type DiagnosticIntentTierConfig,
} from "@/features/auth/components/diagnostic-intent-card"
import {
  saveDiagnosticIntent,
  type DiagnosticIntentTier,
} from "@/lib/auth/diagnostic-intent"

const DIAGNOSTIC_TIERS: DiagnosticIntentTierConfig[] = [
  {
    id: "mini",
    name: "Mini",
    tagline: "Quick overview of your weakest areas",
    questions: "10q",
    duration: "~13 min",
    features: ["5 questions per section", "Basic score estimate", "Quick topic flags"],
    accent: "mini",
  },
  {
    id: "quick",
    name: "Quick",
    tagline: "Find your biggest point leaks fast",
    questions: "30q",
    duration: "~40 min",
    features: ["All 4 sections covered", "Detailed score breakdown", "Point leak map"],
    accent: "quick",
    recommended: true,
  },
]

const TIER_LABELS: Record<DiagnosticIntentTier, string> = {
  mini: "Mini",
  quick: "Quick",
  full: "Full",
}

function intentNavigationState(tier: DiagnosticIntentTier) {
  return { from: "intent" as const, intent: tier }
}

type IntentPageProps = {
  isAuthenticated?: boolean
}

function IntentPage({ isAuthenticated = false }: IntentPageProps) {
  const navigate = useNavigate()
  const [selectedTier, setSelectedTier] = useState<DiagnosticIntentTier>("quick")

  function handleStart() {
    saveDiagnosticIntent(selectedTier)
    if (isAuthenticated) {
      navigate(`/diagnostic/start?intent=${selectedTier}`, { replace: true })
      return
    }
    navigate("/signup", { state: intentNavigationState(selectedTier) })
  }

  return (
    <AuthLayout headerVariant="intent" contentLayout="intent" hideSidebar hideIntentSignIn={isAuthenticated}>
      <div className="intent-page">
        <AuthCard className="intent-page__card">
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
              Start {TIER_LABELS[selectedTier]} Diagnostic
              <ArrowRight className="intent-page__cta-icon" aria-hidden />
            </Button>
            {!isAuthenticated ? (
              <p className="intent-page__sign-in-prompt">
                Already have an account?{" "}
                <Link
                  to="/login"
                  state={intentNavigationState(selectedTier)}
                  className="font-semibold text-[#0d47a1]"
                  onClick={() => saveDiagnosticIntent(selectedTier)}
                >
                  Sign in
                </Link>
              </p>
            ) : null}
          </div>
        </AuthCard>
      </div>
    </AuthLayout>
  )
}

export { IntentPage, intentNavigationState }
