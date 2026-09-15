/** Keep in sync with `supabase/functions/_shared/prep-test-pool-availability.ts`. */

export type PrepTestPoolMembershipFlags = {
  inDrills: boolean
  inSections: boolean
  inTests: boolean
}

/**
 * 7Sage-style label when a PrepTest is shown in the full-test list but cannot be
 * started/retaken because it is not in the tests pool. Returns null when full
 * PrepTests are allowed.
 */
export function prepTestFullTestUnavailableLabel(
  membership: PrepTestPoolMembershipFlags,
): string | null {
  if (membership.inTests) return null
  const parts: string[] = []
  if (membership.inDrills) parts.push("drills")
  if (membership.inSections) parts.push("sections")
  if (parts.length === 0) return "Not available for full PrepTests"
  if (parts.length === 1) return `Available only for ${parts[0]}`
  return `Available only for ${parts[0]} and ${parts[1]}`
}
