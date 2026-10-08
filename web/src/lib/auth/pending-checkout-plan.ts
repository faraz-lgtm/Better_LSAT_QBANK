import type { CheckoutPlanId } from "@/lib/api/billing"

export type SignupPlanId = "free" | CheckoutPlanId

const PENDING_CHECKOUT_PLAN_KEY = "betterlsat:pending-checkout-plan"

export function isSignupPlanId(value: unknown): value is SignupPlanId {
  return (
    value === "free" ||
    value === "monthly" ||
    value === "three_month" ||
    value === "six_month" ||
    value === "yearly"
  )
}

export function parseSignupPlan(value: string | null): SignupPlanId | null {
  return isSignupPlanId(value) ? value : null
}

export function savePendingCheckoutPlan(plan: SignupPlanId): void {
  window.localStorage.setItem(PENDING_CHECKOUT_PLAN_KEY, plan)
}

export function readPendingCheckoutPlan(): SignupPlanId | null {
  return parseSignupPlan(window.localStorage.getItem(PENDING_CHECKOUT_PLAN_KEY))
}

export function clearPendingCheckoutPlan(): void {
  window.localStorage.removeItem(PENDING_CHECKOUT_PLAN_KEY)
}

/**
 * Paid plan intent bypasses onboarding and routes through the authenticated checkout
 * handoff. Free intent keeps the normal onboarding/funnel destination.
 */
export function resolvePendingCheckoutDestination(destination: string): string {
  const plan = readPendingCheckoutPlan()
  if (!plan) return destination

  if (destination === "/admin") return destination

  if (plan === "free") {
    if (
      destination === "/onboarding" ||
      destination === "/intent" ||
      destination === "/diagnostic/start" ||
      destination === "/app/diagnostic/results"
    ) {
      return destination
    }
    clearPendingCheckoutPlan()
    return destination
  }

  return `/checkout?plan=${plan}`
}

export function signupPathForPlan(plan: SignupPlanId): string {
  return `/signup?plan=${plan}`
}

/** Authenticated checkout handoff URL for a paid plan selected on pricing. */
export function checkoutPathForPlan(
  plan: CheckoutPlanId,
  options?: { includeLawHub?: boolean },
): string {
  const params = new URLSearchParams({ plan })
  if (options?.includeLawHub === false) {
    params.set("includeLawHub", "0")
  }
  return `/checkout?${params.toString()}`
}
