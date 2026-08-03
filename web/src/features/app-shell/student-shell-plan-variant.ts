import type { AccessState } from "@/lib/api/users"

type StudentShellVariant = "premium" | "free-plan"

type ResolveStudentShellVariantInput = {
  accessState: AccessState | null
  hasGuestPremiumAccount?: boolean
}

/**
 * Chooses the student shell chrome (sidebar + header CTA) from billing state only.
 * An unknown entitlement (loading or failed fetch) stays premium — route guards and
 * edge functions remain the authoritative gate, so chrome must never lock a paid student.
 */
function resolveStudentShellVariant({
  accessState,
  hasGuestPremiumAccount = false,
}: ResolveStudentShellVariantInput): StudentShellVariant {
  if (hasGuestPremiumAccount) return "premium"
  return accessState === "PAYMENT_REQUIRED" ? "free-plan" : "premium"
}

export { resolveStudentShellVariant, type StudentShellVariant }
