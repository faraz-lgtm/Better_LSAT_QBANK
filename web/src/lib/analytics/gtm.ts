export type DataLayerPush = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: DataLayerPush[]
  }
}

export function pushDataLayer(payload: DataLayerPush): void {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(payload)
}

export type FreeDiagnosticSignupPayload = {
  user_email?: string | null
  user_id?: string
  event_id?: string
  [key: string]: unknown
}

/**
 * Push free_diagnostic_signup for GTM (app container GTM-MJQFXMNX).
 *
 * GTM checklist (manual):
 * - Trigger: Custom Event `free_diagnostic_signup`
 * - Google Ads conversion on that trigger; Enhanced Conversions from `user_email`; Conversion Linker on all pages
 * - Meta Pixel CompleteRegistration on that trigger; Advanced Matching email; Event ID = DL `event_id` (dedup with CAPI)
 * - Verify Ads conversion ID/label
 *
 * Raw `user_email` is intentional — GTM hashes for Enhanced Conversions / Meta matching.
 */
export function trackFreeDiagnosticSignup(payload: FreeDiagnosticSignupPayload = {}): void {
  pushDataLayer({
    event: "free_diagnostic_signup",
    ...payload,
  })
}

/** Resolve after GTM tags acknowledge the event, or after timeoutMs. */
export function pushDataLayerWithCallback(
  payload: DataLayerPush,
  timeoutMs = 300,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const timer = window.setTimeout(done, timeoutMs)
    pushDataLayer({
      ...payload,
      eventCallback: () => {
        window.clearTimeout(timer)
        done()
      },
      eventTimeout: timeoutMs,
    })
  })
}

export async function trackFreeDiagnosticSignupAndWait(
  payload: FreeDiagnosticSignupPayload = {},
  timeoutMs = 300,
): Promise<void> {
  await pushDataLayerWithCallback(
    {
      event: "free_diagnostic_signup",
      ...payload,
    },
    timeoutMs,
  )
}

export function trackPurchase(input: { value: number; transactionId: string }): void {
  pushDataLayer({
    event: "purchase",
    value: input.value,
    currency: "CAD",
    transaction_id: input.transactionId,
  })
}
