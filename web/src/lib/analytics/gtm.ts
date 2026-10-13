export const GTM_PENDING_FREE_DIAGNOSTIC_SIGNUP_KEY = "gtm.pendingFreeDiagnosticSignup"

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

export function markPendingFreeDiagnosticSignup(): void {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(GTM_PENDING_FREE_DIAGNOSTIC_SIGNUP_KEY, "1")
}

export function consumePendingFreeDiagnosticSignup(): boolean {
  if (typeof window === "undefined") return false
  const pending = window.sessionStorage.getItem(GTM_PENDING_FREE_DIAGNOSTIC_SIGNUP_KEY) === "1"
  if (pending) {
    window.sessionStorage.removeItem(GTM_PENDING_FREE_DIAGNOSTIC_SIGNUP_KEY)
  }
  return pending
}

export function trackFreeDiagnosticSignup(): void {
  pushDataLayer({ event: "free_diagnostic_signup" })
}

export function trackPurchase(input: { value: number; transactionId: string }): void {
  pushDataLayer({
    event: "purchase",
    value: input.value,
    currency: "CAD",
    transaction_id: input.transactionId,
  })
}
