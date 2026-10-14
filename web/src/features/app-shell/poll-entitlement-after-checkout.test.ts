import { describe, expect, it, vi } from "vitest"

import {
  entitlementLooksPaid,
  pollEntitlementAfterCheckoutSuccess,
} from "./poll-entitlement-after-checkout"
import type { UserEntitlement } from "@/lib/api/users"

function makeEntitlement(overrides: Partial<UserEntitlement> = {}): UserEntitlement {
  return {
    isAuthenticated: true,
    isLsacLinked: false,
    isLsacEligible: false,
    hasActiveCore: false,
    accessState: "PAYMENT_REQUIRED",
    ...overrides,
  }
}

describe("entitlementLooksPaid", () => {
  it("is true for hasActiveCore", () => {
    expect(entitlementLooksPaid(makeEntitlement({ hasActiveCore: true }))).toBe(true)
  })

  it("is true for FULL_ACCESS", () => {
    expect(
      entitlementLooksPaid(makeEntitlement({ accessState: "FULL_ACCESS", hasActiveCore: false })),
    ).toBe(true)
  })

  it("is false when unpaid", () => {
    expect(entitlementLooksPaid(makeEntitlement())).toBe(false)
    expect(entitlementLooksPaid(null)).toBe(false)
  })
})

describe("pollEntitlementAfterCheckoutSuccess", () => {
  it("no-ops without a success query", async () => {
    const getEntitlement = vi.fn()
    const refresh = vi.fn()

    const synced = await pollEntitlementAfterCheckoutSuccess(new URLSearchParams(), {
      getEntitlement,
      refresh,
    })

    expect(synced).toBe(false)
    expect(getEntitlement).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it("skips when current entitlement is already paid", async () => {
    const getEntitlement = vi.fn()
    const refresh = vi.fn()

    const synced = await pollEntitlementAfterCheckoutSuccess(
      new URLSearchParams("payment=success"),
      {
        getEntitlement,
        refresh,
        currentEntitlement: makeEntitlement({ hasActiveCore: true }),
      },
    )

    expect(synced).toBe(false)
    expect(getEntitlement).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it("polls until active then refreshes once", async () => {
    let calls = 0
    const getEntitlement = vi.fn(async () => {
      calls += 1
      return makeEntitlement({
        hasActiveCore: calls >= 3,
        accessState: calls >= 3 ? "LSAC_REQUIRED" : "PAYMENT_REQUIRED",
      })
    })
    const refresh = vi.fn(async () => makeEntitlement({ hasActiveCore: true }))

    let t = 0
    const synced = await pollEntitlementAfterCheckoutSuccess(
      new URLSearchParams("payment=success&session_id=cs_1"),
      {
        getEntitlement,
        refresh,
        sleepFn: async () => {
          t += 750
        },
        now: () => t,
      },
    )

    expect(synced).toBe(true)
    expect(getEntitlement).toHaveBeenCalledTimes(3)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it("also runs for checkout=success", async () => {
    const getEntitlement = vi.fn(async () =>
      makeEntitlement({ hasActiveCore: true, accessState: "FULL_ACCESS" }),
    )
    const refresh = vi.fn(async () => makeEntitlement({ hasActiveCore: true }))

    const synced = await pollEntitlementAfterCheckoutSuccess(
      new URLSearchParams("checkout=success"),
      {
        getEntitlement,
        refresh,
        sleepFn: async () => undefined,
        now: () => 0,
      },
    )

    expect(synced).toBe(true)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it("times out without refresh when entitlement never becomes active", async () => {
    const getEntitlement = vi.fn(async () => makeEntitlement())
    const refresh = vi.fn()

    let t = 0
    const synced = await pollEntitlementAfterCheckoutSuccess(
      new URLSearchParams("payment=success"),
      {
        getEntitlement,
        refresh,
        sleepFn: async () => {
          t += 10_000
        },
        now: () => t,
      },
    )

    expect(synced).toBe(false)
    expect(refresh).not.toHaveBeenCalled()
    expect(getEntitlement.mock.calls.length).toBeGreaterThanOrEqual(1)
  })

  it("aborts without refresh when signal is aborted", async () => {
    const controller = new AbortController()
    const getEntitlement = vi.fn(async () => {
      controller.abort()
      return makeEntitlement()
    })
    const refresh = vi.fn()

    const synced = await pollEntitlementAfterCheckoutSuccess(
      new URLSearchParams("payment=success"),
      {
        getEntitlement,
        refresh,
        signal: controller.signal,
        sleepFn: async () => undefined,
        now: () => 0,
      },
    )

    expect(synced).toBe(false)
    expect(refresh).not.toHaveBeenCalled()
  })

  it("returns false immediately when already aborted", async () => {
    const controller = new AbortController()
    controller.abort()
    const getEntitlement = vi.fn()
    const refresh = vi.fn()

    const synced = await pollEntitlementAfterCheckoutSuccess(
      new URLSearchParams("payment=success"),
      {
        getEntitlement,
        refresh,
        signal: controller.signal,
        sleepFn: async () => undefined,
        now: () => 0,
      },
    )

    expect(synced).toBe(false)
    expect(getEntitlement).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })
})
