import type { AccessState } from "@/lib/api/users"

/**
 * Free-plan users may browse the Sections page; start/insight/lock actions
 * stay gated in-page behind upgrade (Figma `21587:35363`).
 */
function shouldLimitFreeSectionAccess(input: {
  accessState?: AccessState | null
  hasActiveCore?: boolean | null
}): boolean {
  if (input.hasActiveCore) return false
  return input.accessState === "PAYMENT_REQUIRED"
}

export { shouldLimitFreeSectionAccess }
