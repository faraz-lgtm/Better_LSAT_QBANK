import { describe, expect, it, vi } from "vitest"

import {
  appendCheckoutSuccessQuery,
  purchaseDedupeKey,
  trackCheckoutPurchaseIfNeeded,
} from "./track-checkout-purchase"
import type { BillingStatus } from "@/lib/api/billing"

function makeStatus(overrides: Partial<BillingStatus> = {}): BillingStatus {
  return {
    prepPlusSource: null,
    hasActiveSubscription: false,
    planTier: null,
    checkoutPlan: null,
    pendingChange: null,
    subscription: null,
    ...overrides,
  }
}

describe("appendCheckoutSuccessQuery", () => {
  it("preserves checkout success and session_id on a destination path", () => {
    const params = new URLSearchParams("checkout=success&session_id=cs_123")
    expect(appendCheckoutSuccessQuery("/app", params)).toBe(
      "/app?checkout=success&session_id=cs_123",
    )
  })

  it("returns the path unchanged when there is no success query", () => {
    expect(appendCheckoutSuccessQuery("/app", new URLSearchParams())).toBe("/app")
  })
})

describe("trackCheckoutPurchaseIfNeeded", () => {
  it("does not fire without checkout/payment success", async () => {
    const trackPurchaseFn = vi.fn()
    const storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } as unknown as Storage

    const fired = await trackCheckoutPurchaseIfNeeded(new URLSearchParams("session_id=cs_1"), {
      getStatus: vi.fn(),
      getPlans: vi.fn(),
      trackPurchaseFn,
      sessionStorage: storage,
    })

    expect(fired).toBe(false)
    expect(trackPurchaseFn).not.toHaveBeenCalled()
  })

  it("does not fire without session_id", async () => {
    const trackPurchaseFn = vi.fn()
    const storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } as unknown as Storage

    const fired = await trackCheckoutPurchaseIfNeeded(new URLSearchParams("checkout=success"), {
      getStatus: vi.fn(),
      getPlans: vi.fn(),
      trackPurchaseFn,
      sessionStorage: storage,
    })

    expect(fired).toBe(false)
    expect(trackPurchaseFn).not.toHaveBeenCalled()
  })

  it("waits until hasActiveSubscription before pushing purchase", async () => {
    const trackPurchaseFn = vi.fn()
    const memory = new Map<string, string>()
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value)
      },
      removeItem: (key: string) => {
        memory.delete(key)
      },
    } as unknown as Storage

    let calls = 0
    const getStatus = vi.fn(async () => {
      calls += 1
      return makeStatus({
        hasActiveSubscription: calls >= 2,
        checkoutPlan: "monthly",
      })
    })
    const getPlans = vi.fn(async () => ({
      plans: [{ id: "monthly" as const, priceUsd: 69 }],
    }))

    const fired = await trackCheckoutPurchaseIfNeeded(
      new URLSearchParams("checkout=success&session_id=cs_abc"),
      {
        getStatus,
        getPlans,
        trackPurchaseFn,
        sessionStorage: storage,
        sleepFn: async () => undefined,
        now: (() => {
          let t = 0
          return () => {
            t += 1
            return t
          }
        })(),
      },
    )

    expect(fired).toBe(true)
    expect(getStatus.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(trackPurchaseFn).toHaveBeenCalledWith({
      value: 69,
      transactionId: "cs_abc",
    })
    expect(memory.get(purchaseDedupeKey("cs_abc"))).toBe("1")
  })

  it("does not fire twice for the same session_id", async () => {
    const trackPurchaseFn = vi.fn()
    const memory = new Map<string, string>([[purchaseDedupeKey("cs_dup"), "1"]])
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value)
      },
      removeItem: (key: string) => {
        memory.delete(key)
      },
    } as unknown as Storage

    const fired = await trackCheckoutPurchaseIfNeeded(
      new URLSearchParams("checkout=success&session_id=cs_dup"),
      {
        getStatus: vi.fn(),
        getPlans: vi.fn(),
        trackPurchaseFn,
        sessionStorage: storage,
      },
    )

    expect(fired).toBe(false)
    expect(trackPurchaseFn).not.toHaveBeenCalled()
  })

  it("clears dedupe and skips when subscription never becomes active", async () => {
    const trackPurchaseFn = vi.fn()
    const memory = new Map<string, string>()
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value)
      },
      removeItem: (key: string) => {
        memory.delete(key)
      },
    } as unknown as Storage

    let nowValue = 0
    const fired = await trackCheckoutPurchaseIfNeeded(
      new URLSearchParams("payment=success&session_id=cs_timeout"),
      {
        getStatus: vi.fn(async () => makeStatus({ hasActiveSubscription: false })),
        getPlans: vi.fn(),
        trackPurchaseFn,
        sessionStorage: storage,
        sleepFn: async () => undefined,
        now: () => {
          nowValue += 10_000
          return nowValue
        },
      },
    )

    expect(fired).toBe(false)
    expect(trackPurchaseFn).not.toHaveBeenCalled()
    expect(memory.get(purchaseDedupeKey("cs_timeout"))).toBeUndefined()
  })

  it("uses subscription.checkoutPlan when top-level checkoutPlan is null", async () => {
    const trackPurchaseFn = vi.fn()
    const memory = new Map<string, string>()
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value)
      },
      removeItem: (key: string) => {
        memory.delete(key)
      },
    } as unknown as Storage

    const fired = await trackCheckoutPurchaseIfNeeded(
      new URLSearchParams("checkout=success&session_id=cs_sub"),
      {
        getStatus: vi.fn(async () =>
          makeStatus({
            hasActiveSubscription: true,
            checkoutPlan: null,
            subscription: {
              status: "active",
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false,
              planTier: "core",
              checkoutPlan: "six_month",
            },
          }),
        ),
        getPlans: vi.fn(async () => ({
          plans: [{ id: "six_month" as const, priceUsd: 354 }],
        })),
        trackPurchaseFn,
        sessionStorage: storage,
      },
    )

    expect(fired).toBe(true)
    expect(trackPurchaseFn).toHaveBeenCalledWith({
      value: 354,
      transactionId: "cs_sub",
    })
  })
})
