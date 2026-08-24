import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"

type GuestDiagnosticTestConfig = {
  intentId: GuestDiagnosticIntentId
  title: string
  questionCount: number
  timeMinutes: number
  instructions: string
}

const DIAGNOSTIC_TEST_INSTRUCTIONS =
  "You are about to begin a timed linear diagnostic exam experience. Continue to review your certification terms before the section instructions and timed questions."

const GUEST_DIAGNOSTIC_TEST_CONFIG: Record<GuestDiagnosticIntentId, GuestDiagnosticTestConfig> = {
  mini: {
    intentId: "mini",
    title: "Mini Diagnostic - Test Instructions",
    questionCount: 10,
    timeMinutes: 13,
    instructions: DIAGNOSTIC_TEST_INSTRUCTIONS,
  },
  quick: {
    intentId: "quick",
    title: "Full Diagnostic - Test Instructions",
    questionCount: 30,
    timeMinutes: 40,
    instructions: DIAGNOSTIC_TEST_INSTRUCTIONS,
  },
  full: {
    intentId: "full",
    title: "Full Diagnostic - Test Instructions",
    questionCount: 115,
    timeMinutes: 90,
    instructions: DIAGNOSTIC_TEST_INSTRUCTIONS,
  },
}

function isGuestDiagnosticIntentId(value: string | null | undefined): value is GuestDiagnosticIntentId {
  return value === "mini" || value === "quick" || value === "full"
}

function getGuestDiagnosticTestConfig(intentId: GuestDiagnosticIntentId): GuestDiagnosticTestConfig {
  return GUEST_DIAGNOSTIC_TEST_CONFIG[intentId]
}

function formatDiagnosticTimeMinutes(minutes: number): string {
  return `${minutes} minute${minutes === 1 ? "" : "s"}`
}

export {
  DIAGNOSTIC_TEST_INSTRUCTIONS,
  formatDiagnosticTimeMinutes,
  getGuestDiagnosticTestConfig,
  isGuestDiagnosticIntentId,
  type GuestDiagnosticTestConfig,
}
