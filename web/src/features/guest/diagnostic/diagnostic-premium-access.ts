import type { UserEntitlement } from "@/lib/api/users"
import { hasGuestPremiumAccess } from "@/features/guest/premium/guest-premium-account"

/** Matches student-shell “Premium”: paid, LSAC-setup, or guest premium preview. */
function entitlementUnlocksDiagnosticResults(
  entitlement: Pick<UserEntitlement, "hasActiveCore" | "accessState"> | null,
): boolean {
  if (hasGuestPremiumAccess()) return true
  if (!entitlement) return false
  if (entitlement.hasActiveCore) return true
  return entitlement.accessState === "FULL_ACCESS" || entitlement.accessState === "LSAC_REQUIRED"
}

export { entitlementUnlocksDiagnosticResults }
