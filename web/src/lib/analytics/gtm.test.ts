import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  GTM_PENDING_FREE_DIAGNOSTIC_SIGNUP_KEY,
  consumePendingFreeDiagnosticSignup,
  markPendingFreeDiagnosticSignup,
  pushDataLayer,
  trackFreeDiagnosticSignup,
  trackPurchase,
} from "./gtm"

describe("gtm helpers", () => {
  beforeEach(() => {
    window.dataLayer = []
    window.sessionStorage.clear()
  })

  afterEach(() => {
    window.dataLayer = []
    window.sessionStorage.clear()
  })

  it("pushDataLayer appends to window.dataLayer", () => {
    pushDataLayer({ event: "test_event", foo: 1 })
    expect(window.dataLayer).toEqual([{ event: "test_event", foo: 1 }])
  })

  it("trackFreeDiagnosticSignup pushes the expected event", () => {
    trackFreeDiagnosticSignup()
    expect(window.dataLayer).toEqual([{ event: "free_diagnostic_signup" }])
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

  it("mark and consume pending free diagnostic signup flag", () => {
    expect(consumePendingFreeDiagnosticSignup()).toBe(false)
    markPendingFreeDiagnosticSignup()
    expect(window.sessionStorage.getItem(GTM_PENDING_FREE_DIAGNOSTIC_SIGNUP_KEY)).toBe("1")
    expect(consumePendingFreeDiagnosticSignup()).toBe(true)
    expect(consumePendingFreeDiagnosticSignup()).toBe(false)
  })
})
