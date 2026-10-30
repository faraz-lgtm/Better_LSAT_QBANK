import type { AccessState } from "@/lib/api/users"

/**
 * Free-plan users may browse the Prep Drills page; start/continue/insight
 * actions stay gated in-page behind upgrade (Figma `21587:35080`).
 */
function shouldLimitFreeDrillAccess(input: {
  accessState?: AccessState | null
  hasActiveCore?: boolean | null
}): boolean {
  if (input.hasActiveCore) return false
  return input.accessState === "PAYMENT_REQUIRED"
}

export { shouldLimitFreeDrillAccess }
