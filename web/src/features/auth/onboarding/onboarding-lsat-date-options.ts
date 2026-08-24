type LsatDateOption = { label: string; value: string }

/** Admin LSAT windows shown on the welcome / onboarding signup step. */
const LSAT_ADMIN_DATE_OPTIONS: readonly LsatDateOption[] = [
  { label: "June 2026", value: "2026-06-01" },
  { label: "August 2026", value: "2026-08-01" },
  { label: "September 2026", value: "2026-09-01" },
  { label: "October 2026", value: "2026-10-01" },
  { label: "November 2026", value: "2026-11-01" },
  { label: "January 2027", value: "2027-01-01" },
  { label: "February 2027", value: "2027-02-01" },
]

const NOT_SURE_OPTION: LsatDateOption = { label: "Not sure yet", value: "not_sure" }

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
 * Pick the admin LSAT window closest to 6 months from `now`.
 * Prefers an exact calendar-month match when one exists.
 */
export function getRecommendedLsatDate(now: Date = new Date()): string {
  const targetKey = monthKeyFromDate(addMonths(now, 6))

  const exact = LSAT_ADMIN_DATE_OPTIONS.find(
    (option) => monthKeyFromIso(option.value) === targetKey,
  )
  if (exact) return exact.value

  let best = LSAT_ADMIN_DATE_OPTIONS[0]!
  let bestDistance = monthsBetweenKeys(monthKeyFromIso(best.value), targetKey)

  for (const option of LSAT_ADMIN_DATE_OPTIONS.slice(1)) {
    const distance = monthsBetweenKeys(monthKeyFromIso(option.value), targetKey)
    if (distance < bestDistance) {
      best = option
      bestDistance = distance
    }
  }

  return best.value
}

export function buildOnboardingLsatDateOptions(
  now: Date = new Date(),
): LsatDateOption[] {
  const recommendedValue = getRecommendedLsatDate(now)

  const recommended = LSAT_ADMIN_DATE_OPTIONS.find(
    (option) => option.value === recommendedValue,
  )!

  const rest = LSAT_ADMIN_DATE_OPTIONS.filter(
    (option) => option.value !== recommendedValue,
  ).map((option) => ({ ...option }))

  return [
    { label: `${recommended.label} (Recommended)`, value: recommended.value },
    ...rest,
    { ...NOT_SURE_OPTION },
  ]
}

export const ONBOARDING_RECOMMENDED_LSAT_DATE = getRecommendedLsatDate()

export const ONBOARDING_LSAT_DATE_OPTIONS = buildOnboardingLsatDateOptions()
