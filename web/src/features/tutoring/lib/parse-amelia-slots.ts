import type { TutoringSlotsResponse } from "@/lib/api/tutoring"

export type AmeliaSlotOption = {
  /** Amelia bookingStart: `YYYY-MM-DD HH:mm` */
  bookingStart: string
  dateKey: string
  timeKey: string
  dateLabel: string
  timeLabel: string
  providerId: number | null
}

const DEFAULT_TIME_ZONE = "America/New_York"

/** Format a Date as Amelia local `YYYY-MM-DD HH:mm` in the given IANA zone. */
export function formatAmeliaLocalDateTime(date: Date, timeZone = DEFAULT_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""

  const hour = get("hour") === "24" ? "00" : get("hour")
  return `${get("year")}-${get("month")}-${get("day")} ${hour}:${get("minute")}`
}

export function ameliaSlotsQueryRange(
  daysAhead = 21,
  timeZone = DEFAULT_TIME_ZONE,
  now = new Date(),
): { startDateTime: string; endDateTime: string } {
  const end = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  const startStr = formatAmeliaLocalDateTime(now, timeZone)
  const endStr = formatAmeliaLocalDateTime(end, timeZone)
  return {
    startDateTime: `${startStr.slice(0, 10)} 00:00`,
    endDateTime: `${endStr.slice(0, 10)} 23:59`,
  }
}

function formatDateLabel(dateKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) return dateKey
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12))
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatTimeLabel(timeKey: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeKey.trim())
  if (!match) return timeKey
  const hour = Number(match[1])
  const minute = match[2]
  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute} ${period}`
}

/**
 * Flatten Amelia `data.slots` into selectable options.
 * Slot day map values are arrays of `[providerId, …]` tuples.
 */
export function parseAmeliaSlots(response: TutoringSlotsResponse | null | undefined): AmeliaSlotOption[] {
  const days = response?.data?.slots
  if (!days || typeof days !== "object") return []

  const options: AmeliaSlotOption[] = []
  const dateKeys = Object.keys(days).sort()

  for (const dateKey of dateKeys) {
    const day = days[dateKey]
    if (!day || typeof day !== "object") continue
    const timeKeys = Object.keys(day).sort()
    for (const timeKey of timeKeys) {
      const entries = day[timeKey]
      if (!Array.isArray(entries) || entries.length === 0) continue
      const first = entries[0]
      const providerId =
        Array.isArray(first) && typeof first[0] === "number" && Number.isFinite(first[0])
          ? first[0]
          : null
      options.push({
        bookingStart: `${dateKey} ${timeKey}`,
        dateKey,
        timeKey,
        dateLabel: formatDateLabel(dateKey),
        timeLabel: formatTimeLabel(timeKey),
        providerId,
      })
    }
  }

  return options
}

export function uniqueSlotDates(options: AmeliaSlotOption[]): Array<{ dateKey: string; dateLabel: string }> {
  const seen = new Set<string>()
  const dates: Array<{ dateKey: string; dateLabel: string }> = []
  for (const option of options) {
    if (seen.has(option.dateKey)) continue
    seen.add(option.dateKey)
    dates.push({ dateKey: option.dateKey, dateLabel: option.dateLabel })
  }
  return dates
}

export { DEFAULT_TIME_ZONE as AMELIA_DEFAULT_TIME_ZONE }
