import type { UserEntitlement } from "@/lib/api/users"
import type { DiagnosticFunnelState } from "@/lib/auth/diagnostic-intent"

/** Authenticated students may open /intent (e.g. retake from the app sidebar). */
export function shouldAllowAuthenticatedIntentPage(
  _entitlement: UserEntitlement | null,
  _funnel: DiagnosticFunnelState,
): boolean {
  return true
}
