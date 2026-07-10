type GuestDiagnosticIntentId = "mini" | "quick" | "full"

type GuestDiagnosticIntentOption = {
  id: GuestDiagnosticIntentId
  title: string
  description: string
  questionCount: string
  duration: string
  features: ReadonlyArray<string>
  recommended?: boolean
}

export type { GuestDiagnosticIntentId, GuestDiagnosticIntentOption }
