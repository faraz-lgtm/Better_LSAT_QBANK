import { Check, Clock, FileText } from "lucide-react"

import type { DiagnosticIntentTier } from "@/lib/auth/diagnostic-intent"
import { cn } from "@/lib/utils"

export type DiagnosticIntentTierConfig = {
  id: DiagnosticIntentTier
  name: string
  tagline: string
  questions: string
  duration: string
  features: string[]
  accent: "mini" | "quick" | "full"
  recommended?: boolean
}

type DiagnosticIntentCardProps = {
  tier: DiagnosticIntentTierConfig
  selected: boolean
  onSelect: () => void
}

function DiagnosticIntentCard({ tier, selected, onSelect }: DiagnosticIntentCardProps) {
  return (
    <button
      type="button"
      className={cn(
        "intent-card",
        `intent-card--${tier.accent}`,
        selected && "intent-card--selected",
      )}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {tier.recommended ? <span className="intent-card__badge">Recommended</span> : null}
      <p className="intent-card__name">{tier.name}</p>
      <p className="intent-card__tagline">{tier.tagline}</p>
      <div className="intent-card__stats">
        <span className="intent-card__stat">
          <FileText className="intent-card__stat-icon" aria-hidden />
          {tier.questions}
        </span>
        <span className="intent-card__stat">
          <Clock className="intent-card__stat-icon" aria-hidden />
          {tier.duration}
        </span>
      </div>
      <ul className="intent-card__features">
        {tier.features.map((feature) => (
          <li key={feature}>
            <Check className="intent-card__check" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>
      <div className="intent-card__footer">
        <span className="intent-card__price">Free</span>
      </div>
    </button>
  )
}

export { DiagnosticIntentCard }
