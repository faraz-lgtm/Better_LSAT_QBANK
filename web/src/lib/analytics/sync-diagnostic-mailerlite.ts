import type { SupabaseClient } from "@supabase/supabase-js"

import { createDiagnosticApi } from "@/lib/api/diagnostic"
import { diagnosticResultsSectionFromIntent } from "@/features/student/diagnostic/diagnostic-results-routes"
import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import { readGuestDiagnosticResult } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import { isGuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-test-config"

/**
 * Best-effort MailerLite field sync for an authenticated user.
 * No-ops when there is no session. Never throws to callers.
 */
export async function syncDiagnosticMailerliteIfAuthenticated(
  supabase: SupabaseClient,
  input?: {
    intentId?: GuestDiagnosticIntentId | null
    /** Scaled / final diagnostic score; defaults from stored guest result. */
    diagnosticScore?: number | null
  },
): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession()
    if (!data.session?.access_token) return

    const stored = readGuestDiagnosticResult()
    const storedIntent = stored?.intentId
    const intentId =
      input?.intentId ?? (isGuestDiagnosticIntentId(storedIntent) ? storedIntent : null)
    if (!intentId) return

    const diagnosticType = diagnosticResultsSectionFromIntent(intentId)
    const storedScore = stored?.scaledScore
    const diagnosticScore =
      input?.diagnosticScore !== undefined
        ? input.diagnosticScore
        : typeof storedScore === "number" && Number.isFinite(storedScore)
          ? storedScore
          : null

    await createDiagnosticApi(supabase).syncMailerlite({
      diagnosticDone: true,
      diagnosticType,
      intentId,
      diagnosticScore,
    })
  } catch (error) {
    console.warn("MailerLite diagnostic sync failed:", error)
  }
}
