import type { UserEntitlement } from "@/lib/api/users"

/**
 * Paid student still needs LawHub coach acceptance before full app access.
 * Prefer this over `accessState === "LSAC_REQUIRED"` — that flag only fires when
 * `LSAC_REQUIRE_LINK_WALL=true` (defaults off).
 */
export function needsLsacSetupStep(entitlement: UserEntitlement | null | undefined): boolean {
  if (!entitlement) return false
  return entitlement.hasActiveCore && !entitlement.isLsacEligible
}
