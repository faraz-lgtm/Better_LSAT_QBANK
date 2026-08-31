import type { UserEntitlement, UserProfile } from '@/lib/api/users'

export type AccountLsacLinkState = 'linked' | 'pending' | 'unlinked'

/** True when the student still needs LawHub linking before full app access. */
export function needsLsacLink(profile: UserProfile | null): boolean {
  if (!profile) return true
  const coachingId = profile.student_coaching_id?.trim()
  if (!coachingId) return true
  if (coachingId.startsWith('pending-')) return true
  return false
}

/** Prefer entitlement over profile coaching id alone. */
export function needsLawHubCoachLink(entitlement: UserEntitlement): boolean {
  return entitlement.accessState === 'LSAC_REQUIRED'
}

/**
 * Account-page LSAC status. Prefer entitlement eligibility; fall back to profile coaching id
 * so a paid student who is already linked never sees a stale "Link Account" CTA.
 */
export function resolveAccountLsacLinkState(
  profile: UserProfile | null,
  entitlement: UserEntitlement | null,
): AccountLsacLinkState {
  if (entitlement?.isLsacEligible) return 'linked'
  if (entitlement?.isLsacLinked && !entitlement.isLsacEligible) return 'pending'
  if (!needsLsacLink(profile)) return 'linked'
  const coachingId = profile?.student_coaching_id?.trim()
  if (coachingId?.startsWith('pending-')) return 'pending'
  return 'unlinked'
}
