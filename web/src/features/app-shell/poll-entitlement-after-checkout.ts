import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"

import type { UserEntitlement } from "@/lib/api/users"
import { createUsersApi } from "@/lib/api/users"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const POLL_INTERVAL_MS = 750
const POLL_MAX_MS = 30_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function entitlementLooksPaid(entitlement: UserEntitlement | null | undefined): boolean {
  return Boolean(entitlement?.hasActiveCore || entitlement?.accessState === "FULL_ACCESS")
}

export type PollEntitlementAfterCheckoutDeps = {
  getEntitlement: () => Promise<UserEntitlement>
  refresh: () => Promise<UserEntitlement | null>
  /** Current Redux / context entitlement — skip polling when already paid. */
  currentEntitlement?: UserEntitlement | null
  now?: () => number
  sleepFn?: (ms: number) => Promise<void>
  signal?: AbortSignal
}

/**
 * After Stripe returns with payment/checkout success, poll entitlement until the
 * webhook lands, then sync Redux once via `refresh`. Avoids invalidate-on-each-tick
 * so Account does not flicker a full-page loader.
 */
export async function pollEntitlementAfterCheckoutSuccess(
  searchParams: URLSearchParams,
  deps: PollEntitlementAfterCheckoutDeps,
): Promise<boolean> {
  const checkoutSuccess = searchParams.get("checkout") === "success"
  const paymentSuccess = searchParams.get("payment") === "success"
  if (!checkoutSuccess && !paymentSuccess) return false

  if (entitlementLooksPaid(deps.currentEntitlement)) return false

  const now = deps.now ?? Date.now
  const sleepFn = deps.sleepFn ?? sleep
  const startedAt = now()

  while (now() - startedAt < POLL_MAX_MS) {
    if (deps.signal?.aborted) return false

    const entitlement = await deps.getEntitlement()
    if (deps.signal?.aborted) return false

    if (entitlementLooksPaid(entitlement)) {
      await deps.refresh()
      return true
    }

    await sleepFn(POLL_INTERVAL_MS)
    if (deps.signal?.aborted) return false
  }

  return false
}

export type UsePollEntitlementAfterCheckoutOptions = {
  entitlement: UserEntitlement | null
  refresh: () => Promise<UserEntitlement | null>
}

/** Polls entitlement after Stripe success query, then refreshes Redux once. */
export function usePollEntitlementAfterCheckoutSuccess(
  options: UsePollEntitlementAfterCheckoutOptions,
): void {
  const [searchParams] = useSearchParams()
  const { entitlement, refresh } = options

  useEffect(() => {
    const checkoutSuccess = searchParams.get("checkout") === "success"
    const paymentSuccess = searchParams.get("payment") === "success"
    if (!checkoutSuccess && !paymentSuccess) return
    if (entitlementLooksPaid(entitlement)) return

    const controller = new AbortController()
    const usersApi = createUsersApi(getSupabaseBrowserClient())

    void pollEntitlementAfterCheckoutSuccess(searchParams, {
      getEntitlement: () => usersApi.getEntitlementState(),
      refresh,
      currentEntitlement: entitlement,
      signal: controller.signal,
    }).catch(() => {
      // Post-checkout refresh must not break Account UX.
    })

    return () => {
      controller.abort()
    }
  }, [entitlement, refresh, searchParams])
}
