import type { AccessState } from "@/lib/api/users"

/**
 * Free-plan and premium+LSAC-setup users may open locked browse/preview screens;
 * in-page actions stay gated (upgrade vs Link LSAC modal).
 */
function shouldLimitLockedBrowseAccess(input: {
  accessState?: AccessState | null
  hasActiveCore?: boolean | null
  isLsacSetupRequired?: boolean | null
}): boolean {
  if (input.isLsacSetupRequired) return true
  if (input.hasActiveCore) return false
  return input.accessState === "PAYMENT_REQUIRED"
}

export { shouldLimitLockedBrowseAccess }
