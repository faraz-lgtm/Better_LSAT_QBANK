import type { UserEntitlement } from "@/lib/api/users"
import type { DiagnosticFunnelState } from "@/lib/auth/diagnostic-intent"

export function shouldAllowAuthenticatedIntentPage(
  entitlement: UserEntitlement | null,
  funnel: DiagnosticFunnelState,
): boolean {
  if (funnel.inAcquisitionFunnel) return true
  if (funnel.pendingIntent || !funnel.completedDiagnostic) return true
  if (entitlement?.accessState === "PAYMENT_REQUIRED") return true
  return false
}
