import type { UserEntitlement, UserProfile } from '@/lib/api/users'

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
