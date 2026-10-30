import type { AccessState } from "@/lib/api/users"

/**
 * Free-plan users may browse the Academy Explanations tree; every PrepTest /
 * section / passage / question stays gated in-page behind upgrade (allowance 0).
 */
export const FREE_EXPLANATION_ALLOWANCE = 0

function shouldLimitFreeExplanationAccess(input: {
  accessState?: AccessState | null
  hasActiveCore?: boolean | null
}): boolean {
  if (input.hasActiveCore) return false
  return input.accessState === "PAYMENT_REQUIRED"
}

export { shouldLimitFreeExplanationAccess }
