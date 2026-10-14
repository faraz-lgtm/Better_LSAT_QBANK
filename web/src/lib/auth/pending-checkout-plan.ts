import type { CheckoutPlanId } from "@/lib/api/billing"

export type SignupPlanId = "free" | CheckoutPlanId

const PENDING_CHECKOUT_PLAN_KEY = "betterlsat:pending-checkout-plan"

/** Default Stripe return when checkout was not started from diagnostic results. */
export const DEFAULT_CHECKOUT_SUCCESS_PATH = "/app/lsac-link-step?checkout=success"

/**
 * Client-side allowlist mirroring billing.service parseCheckoutSuccessPath.
 * Returns null when the value is missing or not an in-app success path.
 */
export function parseCheckoutSuccessPathParam(value: string | null): string | null {
  if (value == null || value === "") return null
  const trimmed = value.trim()
  if (trimmed.includes("..")) return null
  const isAppPath =
    trimmed === "/app" || trimmed.startsWith("/app/") || trimmed.startsWith("/app?")
  const isOnboardingPath =
    trimmed === "/onboarding" || trimmed.startsWith("/onboarding?")
  if (!isAppPath && !isOnboardingPath) return null
  return trimmed
}

/** Results CTAs return to the current results URL; everything else → LSAC link step. */
export function resolveCheckoutSuccessPath(pathname: string): string {
  if (pathname.includes("/diagnostic/results")) {
    const base = pathname.split("?")[0] || pathname
    return `${base}?checkout=success`
  }
  return DEFAULT_CHECKOUT_SUCCESS_PATH
}

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

/**
 * Logged-out visitors hitting /checkout (e.g. LP purchase CTAs) should sign up
 * with the plan preserved, then resume authenticated checkout after auth.
 */
export function signupPathFromCheckoutSearch(search: string): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  const plan = parseSignupPlan(params.get("plan"))
  if (!plan) return "/signup"

  savePendingCheckoutPlan(plan)

  if (params.get("includeLawHub") === "0") {
    return `/signup?plan=${plan}&includeLawHub=0`
  }
  return signupPathForPlan(plan)
}

/** Authenticated checkout handoff URL for a paid plan selected on pricing. */
export function checkoutPathForPlan(
  plan: CheckoutPlanId,
  options?: { includeLawHub?: boolean; successPath?: string },
): string {
  const params = new URLSearchParams({ plan })
  if (options?.includeLawHub === false) {
    params.set("includeLawHub", "0")
  }
  const successPath = parseCheckoutSuccessPathParam(options?.successPath ?? null)
  if (successPath) {
    params.set("successPath", successPath)
  }
  return `/checkout?${params.toString()}`
}
