import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  pushDataLayer,
  trackFreeDiagnosticSignup,
  trackFreeDiagnosticSignupAndWait,
  trackPurchase,
} from "./gtm"

describe("gtm helpers", () => {
  beforeEach(() => {
    window.dataLayer = []
    vi.useFakeTimers()
  })

  afterEach(() => {
    window.dataLayer = []
    vi.useRealTimers()
  })

  it("pushDataLayer appends to window.dataLayer", () => {
    pushDataLayer({ event: "test_event", foo: 1 })
    expect(window.dataLayer).toEqual([{ event: "test_event", foo: 1 }])
  })

  it("trackFreeDiagnosticSignup pushes email and attribution", () => {
    trackFreeDiagnosticSignup({
      user_email: "a@b.com",
      user_id: "u1",
      event_id: "signup:u1",
      gclid: "g-1",
    })
    expect(window.dataLayer).toEqual([
      {
        event: "free_diagnostic_signup",
        user_email: "a@b.com",
        user_id: "u1",
        event_id: "signup:u1",
        gclid: "g-1",
      },
    ])
  })

  it("trackFreeDiagnosticSignupAndWait resolves on timeout", async () => {
    const pending = trackFreeDiagnosticSignupAndWait({ user_id: "u1" }, 300)
    expect(window.dataLayer?.[0]).toMatchObject({
      event: "free_diagnostic_signup",
      user_id: "u1",
    })
    await vi.advanceTimersByTimeAsync(300)
    await pending
  })

  it("trackPurchase pushes purchase with CAD currency", () => {
    trackPurchase({ value: 69, transactionId: "cs_test_123" })
    expect(window.dataLayer).toEqual([
      {
        event: "purchase",
        value: 69,
        currency: "CAD",
        transaction_id: "cs_test_123",
      },
    ])
  })
})
