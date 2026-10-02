export type LsatTestWindowOption = {
  /** Compact chip / account display, e.g. "September 2026" */
  label: string
  /** Dropdown detail, e.g. "Test dates Sep 9–12, 2026" */
  detail: string
  /** First day of the official LSAC window (countdown + stored value) */
  value: string
}

/** Official LSAC upcoming / future test registration windows. */
export const LSAC_OFFICIAL_TEST_WINDOWS: readonly LsatTestWindowOption[] = [
  {
    label: "September 2026",
    detail: "Test dates Sep 9–12, 2026",
    value: "2026-09-09",
  },
  {
    label: "October 2026",
    detail: "Test dates Oct 7–10, 2026",
    value: "2026-10-07",
  },
  {
    label: "November 2026",
    detail: "Test dates Nov 11–14, 2026",
    value: "2026-11-11",
  },
  {
    label: "January 2027",
    detail: "Test dates Jan 13–16, 2027",
    value: "2027-01-13",
  },
  {
    label: "February 2027",
    detail: "Test dates Feb 12–13, 2027",
    value: "2027-02-12",
  },
  {
    label: "April 2027",
    detail: "Test dates Apr 8–10, 2027",
    value: "2027-04-08",
  },
  {
    label: "June 2027",
    detail: "Test dates Jun 9–12, 2027",
    value: "2027-06-09",
  },
]

/** First `YYYY-MM-DD` in an ISO date or timestamp (`2026-09-09T00:00:00.000Z`). */
export function toIsoDateOnly(value: string | null | undefined): string | null {
  const match = value?.trim().match(/^(\d{4}-\d{2}-\d{2})/)
  return match?.[1] ?? null
}

function monthKeyFromIso(isoDate: string): string | null {
  const day = toIsoDateOnly(isoDate)
  return day ? day.slice(0, 7) : null
}

function findLsacTestWindowByLabel(value: string | null | undefined): LsatTestWindowOption | undefined {
  const key = value?.trim()
  if (!key) return undefined
  return LSAC_OFFICIAL_TEST_WINDOWS.find((item) => item.label === key || item.value === key)
}

/** Match by exact value, same calendar month (legacy first-of-month), or saved window label. */
export function findLsacTestWindow(
  isoDate: string | null | undefined,
  plannedLsatWindow?: string | null,
): LsatTestWindowOption | undefined {
  const day = toIsoDateOnly(isoDate)
  if (day) {
    const exact = LSAC_OFFICIAL_TEST_WINDOWS.find((item) => item.value === day)
    if (exact) return exact
    const key = monthKeyFromIso(day)
    const byMonth = LSAC_OFFICIAL_TEST_WINDOWS.find((item) => monthKeyFromIso(item.value) === key)
    if (byMonth) return byMonth
  }
  return findLsacTestWindowByLabel(plannedLsatWindow) ?? findLsacTestWindowByLabel(isoDate)
}

export function resolveLsacTestWindowValue(
  isoDate: string | null | undefined,
  plannedLsatWindow?: string | null,
): string {
  const match = findLsacTestWindow(isoDate, plannedLsatWindow)
  if (match) return match.value
  return toIsoDateOnly(isoDate) ?? isoDate?.trim() ?? ""
}

export function formatLsacTestWindowLabel(
  isoDate: string | null | undefined,
  plannedLsatWindow?: string | null,
): string {
  const option = findLsacTestWindow(isoDate, plannedLsatWindow)
  if (option) return option.label
  if (!isoDate?.trim()) return "—"
  const day = toIsoDateOnly(isoDate) ?? isoDate.trim()
  try {
    const d = new Date(`${day}T12:00:00`)
    if (Number.isNaN(d.getTime())) return isoDate.trim()
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" })
  } catch {
    return isoDate.trim()
  }
}

export function formatLsacTestWindowMeta(
  isoDate: string | null | undefined,
  plannedLsatWindow?: string | null,
): string {
  const option = findLsacTestWindow(isoDate, plannedLsatWindow)
  if (option) return `LSAC · ${option.detail.replace(/^Test dates\s+/i, "")}`
  if (!isoDate?.trim()) return "Set your LSAC test date to start the countdown"
  const day = toIsoDateOnly(isoDate) ?? isoDate.trim()
  try {
    const d = new Date(`${day}T12:00:00`)
    if (Number.isNaN(d.getTime())) return `LSAC · ${isoDate}`
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    return `LSAC · ${label}`
  } catch {
    return `LSAC · ${isoDate}`
  }
}

/** Dropdown / select options — month + official LSAC date range. */
export function toLsacSelectOptions(
  options: readonly LsatTestWindowOption[] = LSAC_OFFICIAL_TEST_WINDOWS,
): Array<{ label: string; value: string }> {
  return options.map((option) => ({
    value: option.value,
    label: option.detail ? `${option.label}: ${option.detail}` : option.label,
  }))
}

/**
 * Official windows still available to pick — excludes administrations whose
 * first test day has already arrived (in progress or fully passed).
 */
export function listUpcomingLsacTestWindows(
  now: Date = new Date(),
  options: readonly LsatTestWindowOption[] = LSAC_OFFICIAL_TEST_WINDOWS,
): LsatTestWindowOption[] {
  const today = new Date(now)
  today.setHours(12, 0, 0, 0)
  return options.filter((option) => {
    const start = new Date(`${option.value.trim()}T12:00:00`)
    if (Number.isNaN(start.getTime())) return false
    return start.getTime() > today.getTime()
  })
}
