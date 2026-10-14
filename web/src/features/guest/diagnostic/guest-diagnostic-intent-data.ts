import type { GuestDiagnosticIntentOption } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import { DIAGNOSTIC_INTENT_STORAGE_KEY } from "@/lib/auth/diagnostic-intent"

/** Figma `19510:19017` — guest diagnostic intent options */
const GUEST_DIAGNOSTIC_INTENT_OPTIONS: ReadonlyArray<GuestDiagnosticIntentOption> = [
  {
    id: "mini",
    title: "Quick Baseline",
    description: "Quick overview of your weakest areas",
    questionCount: "10q",
    duration: "~20 min",
    features: ["5 questions per section", "Basic score estimate", "Quick topic flags"],
  },
  {
    id: "quick",
    title: "Full Section",
    description: "Find your biggest point leaks fast",
    questionCount: "25q",
    duration: "~35 min",
    recommended: true,
    features: ["All 4 sections covered", "Detailed score breakdown", "Point leak map"],
  },
] as const

/** @deprecated Use DIAGNOSTIC_INTENT_STORAGE_KEY from @/lib/auth/diagnostic-intent */
const GUEST_DIAGNOSTIC_INTENT_STORAGE_KEY = DIAGNOSTIC_INTENT_STORAGE_KEY

export { GUEST_DIAGNOSTIC_INTENT_OPTIONS, GUEST_DIAGNOSTIC_INTENT_STORAGE_KEY }
