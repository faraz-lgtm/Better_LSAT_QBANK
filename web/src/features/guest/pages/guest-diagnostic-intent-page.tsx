import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

import {
  GUEST_DIAGNOSTIC_INTENT_OPTIONS,
  GUEST_DIAGNOSTIC_INTENT_STORAGE_KEY,
} from "@/features/guest/diagnostic/guest-diagnostic-intent-data"
import { GuestDiagnosticIntentLayout } from "@/features/guest/diagnostic/guest-diagnostic-intent-layout"
import {
  GUEST_INTENT_CARD_GRID_CLASS,
  GUEST_INTENT_CONTENT_CLASS,
  GUEST_INTENT_START_BUTTON_CLASS,
} from "@/features/guest/diagnostic/guest-diagnostic-intent-styles"
import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import { GuestDiagnosticOptionCard } from "@/features/guest/diagnostic/guest-diagnostic-option-card"

function getStartLabel(intentId: GuestDiagnosticIntentId): string {
  const option = GUEST_DIAGNOSTIC_INTENT_OPTIONS.find((entry) => entry.id === intentId)
  if (!option) return "Start Diagnostic"
  return option.title.endsWith("Diagnostic") ? `Start ${option.title}` : `Start ${option.title} Diagnostic`
}

function GuestDiagnosticIntentPage() {
  const navigate = useNavigate()
  const [selectedIntent, setSelectedIntent] = useState<GuestDiagnosticIntentId>("quick")

  function handleStart() {
    sessionStorage.setItem(GUEST_DIAGNOSTIC_INTENT_STORAGE_KEY, selectedIntent)
    navigate("/signup", { state: { from: "intent", intent: selectedIntent }, replace: false })
  }

  return (
    <GuestDiagnosticIntentLayout>
      <div className={GUEST_INTENT_CONTENT_CLASS}>
        <h1 className="text-center text-2xl font-bold leading-[1.3] text-[#062357]">How do you want to start?</h1>
        <p className="pt-3 text-center text-sm font-normal leading-[1.5] tracking-[0.28px] text-[#8a8aaa]">
          Pick the path that fits your schedule. Everything free upgrade only when you&apos;re ready.
        </p>

        <h2 className="pt-3 text-center text-xl font-bold leading-[1.35] text-[#062357]">Take diagnostic</h2>

        <div className={GUEST_INTENT_CARD_GRID_CLASS}>
          {GUEST_DIAGNOSTIC_INTENT_OPTIONS.map((option) => (
            <GuestDiagnosticOptionCard
              key={option.id}
              option={option}
              selected={selectedIntent === option.id}
              onSelect={() => setSelectedIntent(option.id)}
            />
          ))}
        </div>

        <div className="flex w-full justify-center pt-8">
          <button type="button" className={GUEST_INTENT_START_BUTTON_CLASS} onClick={handleStart}>
            {getStartLabel(selectedIntent)}
            <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </GuestDiagnosticIntentLayout>
  )
}

export { GuestDiagnosticIntentPage, getStartLabel }
