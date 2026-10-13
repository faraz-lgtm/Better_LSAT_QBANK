import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import type { SupabaseClient } from "@supabase/supabase-js"

import { trackPurchase } from "@/lib/analytics/gtm"
import {
  createBillingApi,
  type BillingStatus,
  type CheckoutPlanId,
} from "@/lib/api/billing"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PURCHASE_DEDUPE_PREFIX = "gtm.purchase."
const POLL_INTERVAL_MS = 750
const POLL_MAX_MS = 30_000

export function purchaseDedupeKey(sessionId: string): string {
  return `${PURCHASE_DEDUPE_PREFIX}${sessionId}`
}

export function appendCheckoutSuccessQuery(path: string, searchParams: URLSearchParams): string {
  const next = new URLSearchParams()
  if (searchParams.get("checkout") === "success") {
    next.set("checkout", "success")
  }
  if (searchParams.get("payment") === "success") {
    next.set("payment", "success")
  }
  const sessionId = searchParams.get("session_id")
  if (sessionId) next.set("session_id", sessionId)
  const query = next.toString()
  if (!query) return path
  return `${path}${path.includes("?") ? "&" : "?"}${query}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export type TrackCheckoutPurchaseDeps = {
  getStatus: () => Promise<BillingStatus>
  getPlans: () => Promise<{ plans: Array<{ id: CheckoutPlanId; priceUsd: number }> }>
  trackPurchaseFn?: typeof trackPurchase
  now?: () => number
  sleepFn?: (ms: number) => Promise<void>
  sessionStorage?: Storage
}

export async function trackCheckoutPurchaseIfNeeded(
  searchParams: URLSearchParams,
  deps: TrackCheckoutPurchaseDeps,
): Promise<boolean> {
  const checkoutSuccess = searchParams.get("checkout") === "success"
  const paymentSuccess = searchParams.get("payment") === "success"
  if (!checkoutSuccess && !paymentSuccess) return false

  const sessionId = searchParams.get("session_id")?.trim()
  if (!sessionId) return false

  const storage = deps.sessionStorage ?? (typeof window !== "undefined" ? window.sessionStorage : null)
  if (!storage) return false

  const dedupeKey = purchaseDedupeKey(sessionId)
  if (storage.getItem(dedupeKey) === "1") return false
  // Reserve immediately so StrictMode double-invoke does not double-fire.
  storage.setItem(dedupeKey, "1")

  const now = deps.now ?? Date.now
  const sleepFn = deps.sleepFn ?? sleep
  const track = deps.trackPurchaseFn ?? trackPurchase
  const startedAt = now()

  let status: BillingStatus | null = null
  while (now() - startedAt < POLL_MAX_MS) {
    status = await deps.getStatus()
    if (status.hasActiveSubscription) break
    await sleepFn(POLL_INTERVAL_MS)
  }

  if (!status?.hasActiveSubscription) {
    storage.removeItem(dedupeKey)
    return false
  }

  const checkoutPlan = status.checkoutPlan ?? status.subscription?.checkoutPlan
  if (!checkoutPlan) {
    storage.removeItem(dedupeKey)
    return false
  }

  const catalog = await deps.getPlans()
  const plan = catalog.plans.find((item) => item.id === checkoutPlan)
  if (!plan) {
    storage.removeItem(dedupeKey)
    return false
  }

  track({ value: plan.priceUsd, transactionId: sessionId })
  return true
}

function createDefaultBillingDeps(client: SupabaseClient): TrackCheckoutPurchaseDeps {
  const billingApi = createBillingApi(client)
  return {
    getStatus: () => billingApi.getStatus(),
    getPlans: () => billingApi.getPlans(),
  }
}

/** Fires GTM purchase after Stripe return once subscription is confirmed. */
export function useTrackCheckoutPurchase(): void {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    async function run() {
      try {
        const client = getSupabaseBrowserClient()
        await trackCheckoutPurchaseIfNeeded(searchParams, createDefaultBillingDeps(client))
      } catch {
        // Purchase tracking must not break post-checkout UX.
      }
    }

    void run()
  }, [searchParams])
}
