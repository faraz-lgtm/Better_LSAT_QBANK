import type { AccessState } from "@/lib/api/users"
import { shouldLimitLockedBrowseAccess } from "@/lib/auth/should-limit-locked-browse-access"

/**
 * Free-plan / LSAC-setup users may browse the Prep Drills page; start/continue/insight
 * actions stay gated in-page (Figma `21587:35080`).
 */
function shouldLimitFreeDrillAccess(input: {
  accessState?: AccessState | null
  hasActiveCore?: boolean | null
  isLsacSetupRequired?: boolean | null
}): boolean {
  return shouldLimitLockedBrowseAccess(input)
}

export { shouldLimitFreeDrillAccess }
