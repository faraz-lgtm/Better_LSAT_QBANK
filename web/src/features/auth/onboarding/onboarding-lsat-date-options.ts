import {
  LSAC_OFFICIAL_TEST_WINDOWS,
  listUpcomingLsacTestWindows,
  toLsacSelectOptions,
  type LsatTestWindowOption,
} from "@/lib/lsac-test-window-options"

type LsatDateOption = { label: string; value: string }

/** Admin LSAT windows shown on the welcome / onboarding signup step. */
const LSAT_ADMIN_DATE_OPTIONS = LSAC_OFFICIAL_TEST_WINDOWS

function upcomingAdminOptions(now: Date): LsatTestWindowOption[] {
  return listUpcomingLsacTestWindows(now, LSAT_ADMIN_DATE_OPTIONS)
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime())
  next.setMonth(next.getMonth() + months)
  return next
}

function monthKeyFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function monthKeyFromIso(isoDate: string): string {
  return isoDate.slice(0, 7)
}

function monthsBetweenKeys(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number)
  const [by, bm] = b.split("-").map(Number)
  return Math.abs((ay - by) * 12 + (am - bm))
}

/**
 * Pick the upcoming admin LSAT window closest to 6 months from `now`.
 * Prefers an exact calendar-month match when one exists.
 * Past / in-progress administrations are never recommended.
 */
export function getRecommendedLsatDate(now: Date = new Date()): string {
  const upcoming = upcomingAdminOptions(now)
  if (upcoming.length === 0) return ""

  const targetKey = monthKeyFromDate(addMonths(now, 6))

  const exact = upcoming.find(
    (option) => monthKeyFromIso(option.value) === targetKey,
  )
  if (exact) return exact.value

  let best = upcoming[0]!
  let bestDistance = monthsBetweenKeys(monthKeyFromIso(best.value), targetKey)

  for (const option of upcoming.slice(1)) {
    const distance = monthsBetweenKeys(monthKeyFromIso(option.value), targetKey)
    if (distance < bestDistance) {
      best = option
      bestDistance = distance
    }
  }

  return best.value
}

/** Future LSAC windows only — excludes administrations whose first test day has arrived. */
export function buildOnboardingLsatDateOptions(
  now: Date = new Date(),
): LsatDateOption[] {
  const upcoming = upcomingAdminOptions(now)
  if (upcoming.length === 0) return []

  const recommendedValue = getRecommendedLsatDate(now)
  const selectOptions = toLsacSelectOptions(upcoming)

  const recommended = selectOptions.find((option) => option.value === recommendedValue)
  if (!recommended) return selectOptions

  const rest = selectOptions.filter((option) => option.value !== recommendedValue)

  return [
    { label: `${recommended.label} (Recommended)`, value: recommended.value },
    ...rest,
  ]
}

export const ONBOARDING_RECOMMENDED_LSAT_DATE = getRecommendedLsatDate()

export const ONBOARDING_LSAT_DATE_OPTIONS = buildOnboardingLsatDateOptions()

export type { LsatTestWindowOption }
