import type { AccessState } from "@/lib/api/users"
import { shouldLimitLockedBrowseAccess } from "@/lib/auth/should-limit-locked-browse-access"

/**
 * Free-plan / LSAC-setup users may browse the Academy Explanations tree; every PrepTest /
 * section / passage / question stays gated in-page (allowance 0).
 */
export const FREE_EXPLANATION_ALLOWANCE = 0

function shouldLimitFreeExplanationAccess(input: {
  accessState?: AccessState | null
  hasActiveCore?: boolean | null
  isLsacSetupRequired?: boolean | null
}): boolean {
  return shouldLimitLockedBrowseAccess(input)
}

export { shouldLimitFreeExplanationAccess }
