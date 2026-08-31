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

function monthKeyFromIso(isoDate: string): string {
  return isoDate.trim().slice(0, 7)
}

/** Match by exact value or same calendar month (legacy first-of-month values). */
export function findLsacTestWindow(
  isoDate: string | null | undefined,
): LsatTestWindowOption | undefined {
  if (!isoDate?.trim()) return undefined
  const trimmed = isoDate.trim()
  const exact = LSAC_OFFICIAL_TEST_WINDOWS.find((item) => item.value === trimmed)
  if (exact) return exact
  const key = monthKeyFromIso(trimmed)
  return LSAC_OFFICIAL_TEST_WINDOWS.find((item) => monthKeyFromIso(item.value) === key)
}

export function resolveLsacTestWindowValue(
  isoDate: string | null | undefined,
  _plannedLsatWindow?: string | null,
): string {
  const match = findLsacTestWindow(isoDate)
  if (match) return match.value
  if (isoDate?.trim()) return isoDate.trim()
  return ""
}

export function formatLsacTestWindowLabel(
  isoDate: string | null | undefined,
  _plannedLsatWindow?: string | null,
): string {
  if (!isoDate?.trim()) return "—"
  const option = findLsacTestWindow(isoDate)
  if (option) return option.label
  try {
    const d = new Date(`${isoDate.trim()}T12:00:00`)
    if (Number.isNaN(d.getTime())) return isoDate.trim()
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" })
  } catch {
    return isoDate.trim()
  }
}

export function formatLsacTestWindowMeta(
  isoDate: string | null | undefined,
  _plannedLsatWindow?: string | null,
): string {
  if (!isoDate?.trim()) return "Set your LSAC test date to start the countdown"
  const option = findLsacTestWindow(isoDate)
  if (option) return `LSAC · ${option.detail.replace(/^Test dates\s+/i, "")}`
  try {
    const d = new Date(`${isoDate.trim()}T12:00:00`)
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
