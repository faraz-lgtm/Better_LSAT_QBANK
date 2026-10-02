/** Platform default PrepTest pool membership by LSAC PT number (PT100+). */

export type PrepTestPoolMembership = {
  inDrills: boolean
  inSections: boolean
  inTests: boolean
}

/** Oldest band: drills only (through PT122). */
export const PREP_TEST_POOL_DRILL_ONLY_MAX = 122
/** Middle band upper bound: all pools on (PT123–152). */
export const PREP_TEST_POOL_MIDDLE_MAX = 152

/**
 * Default membership adapted from 7Sage-style guidance:
 * - PT100–122: drills only
 * - PT123–152: drills + sections + tests
 * - PT153+: tests only (reserved fresh)
 */
export function defaultPrepTestPoolMembership(prepTestNumber: number): PrepTestPoolMembership {
  if (!Number.isFinite(prepTestNumber) || prepTestNumber < 100) {
    return { inDrills: false, inSections: false, inTests: false }
  }
  if (prepTestNumber <= PREP_TEST_POOL_DRILL_ONLY_MAX) {
    return { inDrills: true, inSections: false, inTests: false }
  }
  if (prepTestNumber <= PREP_TEST_POOL_MIDDLE_MAX) {
    return { inDrills: true, inSections: true, inTests: true }
  }
  return { inDrills: false, inSections: false, inTests: true }
}

export function membershipEquals(a: PrepTestPoolMembership, b: PrepTestPoolMembership): boolean {
  return a.inDrills === b.inDrills && a.inSections === b.inSections && a.inTests === b.inTests
}

export function resolvePrepTestPoolMembership(
  prepTestNumber: number,
  override: PrepTestPoolMembership | null | undefined,
): PrepTestPoolMembership {
  return override ?? defaultPrepTestPoolMembership(prepTestNumber)
}
