import type { AccessState } from "@/lib/api/users"
import { shouldLimitLockedBrowseAccess } from "@/lib/auth/should-limit-locked-browse-access"

/**
 * Free-plan / LSAC-setup users may browse Prep Sections; start actions stay gated in-page.
 */
function shouldLimitFreeSectionAccess(input: {
  accessState?: AccessState | null
  hasActiveCore?: boolean | null
  isLsacSetupRequired?: boolean | null
}): boolean {
  return shouldLimitLockedBrowseAccess(input)
}

export { shouldLimitFreeSectionAccess }
