import { useSyncExternalStore } from "react"

import type { GuestPricingPlanId } from "@/features/guest/pricing/guest-pricing-plans-data"

const GUEST_PREMIUM_ACCOUNT_STORAGE_KEY = "guestPremiumAccount"

type GuestPremiumAccount = {
  planId: GuestPricingPlanId
  activatedAt: string
}

const PREMIUM_CHANGE_EVENT = "guest-premium-account-change"

function readGuestPremiumAccount(): GuestPremiumAccount | null {
  const raw = sessionStorage.getItem(GUEST_PREMIUM_ACCOUNT_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as GuestPremiumAccount
    if (!parsed?.planId) return null
    return parsed
  } catch {
    return null
  }
}

function writeGuestPremiumAccount(planId: GuestPricingPlanId): void {
  const payload: GuestPremiumAccount = {
    planId,
    activatedAt: new Date().toISOString(),
  }
  sessionStorage.setItem(GUEST_PREMIUM_ACCOUNT_STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new Event(PREMIUM_CHANGE_EVENT))
}

function clearGuestPremiumAccount(): void {
  sessionStorage.removeItem(GUEST_PREMIUM_ACCOUNT_STORAGE_KEY)
  window.dispatchEvent(new Event(PREMIUM_CHANGE_EVENT))
}

function hasGuestPremiumAccess(): boolean {
  return readGuestPremiumAccount() != null
}

function subscribeGuestPremiumAccount(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange()
  window.addEventListener(PREMIUM_CHANGE_EVENT, handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener(PREMIUM_CHANGE_EVENT, handler)
    window.removeEventListener("storage", handler)
  }
}

function useGuestPremiumAccount(): GuestPremiumAccount | null {
  return useSyncExternalStore(subscribeGuestPremiumAccount, readGuestPremiumAccount, () => null)
}

export {
  clearGuestPremiumAccount,
  GUEST_PREMIUM_ACCOUNT_STORAGE_KEY,
  hasGuestPremiumAccess,
  readGuestPremiumAccount,
  useGuestPremiumAccount,
  writeGuestPremiumAccount,
  type GuestPremiumAccount,
}
