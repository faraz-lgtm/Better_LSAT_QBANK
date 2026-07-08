import { readGuestDiagnosticResult } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"

export type DiagnosticIntentTier = "mini" | "quick" | "full"

export const DIAGNOSTIC_INTENT_STORAGE_KEY = "guestDiagnosticIntent"
export const DIAGNOSTIC_FUNNEL_ACTIVE_KEY = "diagnosticFunnelActive"

/** @deprecated Use DIAGNOSTIC_INTENT_STORAGE_KEY */
export const GUEST_DIAGNOSTIC_INTENT_STORAGE_KEY = DIAGNOSTIC_INTENT_STORAGE_KEY

const VALID_TIERS = new Set<DiagnosticIntentTier>(["mini", "quick", "full"])
const DEFAULT_DIAGNOSTIC_INTENT: DiagnosticIntentTier = "quick"

function isDiagnosticIntentTier(value: unknown): value is DiagnosticIntentTier {
  return typeof value === "string" && VALID_TIERS.has(value as DiagnosticIntentTier)
}

function readStoredIntent(): DiagnosticIntentTier | null {
  if (typeof window === "undefined") return null
  const sessionRaw = window.sessionStorage.getItem(DIAGNOSTIC_INTENT_STORAGE_KEY)
  if (isDiagnosticIntentTier(sessionRaw)) return sessionRaw
  const localRaw = window.localStorage.getItem(DIAGNOSTIC_INTENT_STORAGE_KEY)
  return isDiagnosticIntentTier(localRaw) ? localRaw : null
}

function writeStoredIntent(tier: DiagnosticIntentTier): void {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(DIAGNOSTIC_INTENT_STORAGE_KEY, tier)
  window.localStorage.setItem(DIAGNOSTIC_INTENT_STORAGE_KEY, tier)
}

export function markDiagnosticFunnelActive(): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DIAGNOSTIC_FUNNEL_ACTIVE_KEY, "1")
}

export function isDiagnosticFunnelActive(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(DIAGNOSTIC_FUNNEL_ACTIVE_KEY) === "1"
}

export function saveDiagnosticIntent(tier: DiagnosticIntentTier): void {
  writeStoredIntent(tier)
  markDiagnosticFunnelActive()
}

export function readDiagnosticIntent(): DiagnosticIntentTier | null {
  return readStoredIntent()
}

export function ensureDiagnosticIntent(): DiagnosticIntentTier {
  const existing = readStoredIntent()
  if (existing) return existing
  writeStoredIntent(DEFAULT_DIAGNOSTIC_INTENT)
  markDiagnosticFunnelActive()
  return DEFAULT_DIAGNOSTIC_INTENT
}

export function clearDiagnosticIntent(): void {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(DIAGNOSTIC_INTENT_STORAGE_KEY)
  window.localStorage.removeItem(DIAGNOSTIC_INTENT_STORAGE_KEY)
}

export function clearDiagnosticFunnel(): void {
  clearDiagnosticIntent()
  if (typeof window === "undefined") return
  window.localStorage.removeItem(DIAGNOSTIC_FUNNEL_ACTIVE_KEY)
}

export function hasPendingDiagnosticIntent(): boolean {
  return readDiagnosticIntent() !== null
}

export function hasCompletedDiagnostic(): boolean {
  return readGuestDiagnosticResult() !== null
}

/** User entered via /intent and has not finished the diagnostic exam yet. */
export function isInDiagnosticAcquisitionFunnel(): boolean {
  return isDiagnosticFunnelActive() && !hasCompletedDiagnostic()
}

export type DiagnosticFunnelState = {
  pendingIntent: DiagnosticIntentTier | null
  completedDiagnostic: boolean
  funnelActive: boolean
  inAcquisitionFunnel: boolean
}

export function readDiagnosticFunnelState(): DiagnosticFunnelState {
  const pendingIntent = readDiagnosticIntent()
  const completedDiagnostic = hasCompletedDiagnostic()
  const funnelActive = isDiagnosticFunnelActive()
  return {
    pendingIntent,
    completedDiagnostic,
    funnelActive,
    inAcquisitionFunnel: funnelActive && !completedDiagnostic,
  }
}
