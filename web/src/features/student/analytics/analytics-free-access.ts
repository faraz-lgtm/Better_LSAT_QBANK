import type { AccessState } from "@/lib/api/users"
import { shouldLimitLockedBrowseAccess } from "@/lib/auth/should-limit-locked-browse-access"

/**
 * Free-plan / LSAC-setup users may browse Insights pages; metrics stay gated in-page
 * behind blurred placeholders + locked-content modal (upgrade or Link LSAC).
 */
function shouldLimitFreeAnalyticsAccess(input: {
  accessState?: AccessState | null
  hasActiveCore?: boolean | null
  isLsacSetupRequired?: boolean | null
}): boolean {
  return shouldLimitLockedBrowseAccess(input)
}

export { shouldLimitFreeAnalyticsAccess }
