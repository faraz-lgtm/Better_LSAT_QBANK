import type { AccessState } from "@/lib/api/users"

/**
 * Free-plan users may browse Insights pages; metrics stay gated in-page behind
 * blurred placeholders + the locked-content upgrade modal.
 */
function shouldLimitFreeAnalyticsAccess(input: {
  accessState?: AccessState | null
  hasActiveCore?: boolean | null
}): boolean {
  if (input.hasActiveCore) return false
  return input.accessState === "PAYMENT_REQUIRED"
}

export { shouldLimitFreeAnalyticsAccess }
