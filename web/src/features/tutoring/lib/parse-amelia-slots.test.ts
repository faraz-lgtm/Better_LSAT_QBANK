import { describe, expect, it } from "vitest"

import {
  ameliaSlotsQueryRange,
  formatAmeliaLocalDateTime,
  parseAmeliaSlots,
  uniqueSlotDates,
} from "@/features/tutoring/lib/parse-amelia-slots"

describe("parseAmeliaSlots", () => {
  it("flattens Amelia day/time maps into bookingStart options", () => {
    const options = parseAmeliaSlots({
      data: {
        slots: {
          "2026-11-20": {
            "09:00": [[12, 1]],
            "14:30": [[12, 1], [15, 1]],
          },
          "2026-11-18": {
            "10:00": [[12, 1]],
          },
        },
      },
    })

    expect(options.map((o) => o.bookingStart)).toEqual([
      "2026-11-18 10:00",
      "2026-11-20 09:00",
      "2026-11-20 14:30",
    ])
    expect(options[0]?.timeLabel).toBe("10:00 AM")
    expect(options[2]?.timeLabel).toBe("2:30 PM")
    expect(options[0]?.providerId).toBe(12)
  })

  it("returns empty for missing slots", () => {
    expect(parseAmeliaSlots(null)).toEqual([])
    expect(parseAmeliaSlots({})).toEqual([])
  })
})

describe("uniqueSlotDates", () => {
  it("dedupes dates in order", () => {
    const options = parseAmeliaSlots({
      data: {
        slots: {
          "2026-11-20": { "09:00": [[1, 1]], "10:00": [[1, 1]] },
          "2026-11-19": { "11:00": [[1, 1]] },
        },
      },
    })
    expect(uniqueSlotDates(options).map((d) => d.dateKey)).toEqual(["2026-11-19", "2026-11-20"])
  })
})

describe("ameliaSlotsQueryRange", () => {
  it("builds a 00:00–23:59 Amelia window", () => {
    const now = new Date("2026-11-13T15:30:00.000Z")
    const range = ameliaSlotsQueryRange(2, "UTC", now)
    expect(range.startDateTime).toBe("2026-11-13 00:00")
    expect(range.endDateTime).toBe("2026-11-15 23:59")
  })
})

describe("formatAmeliaLocalDateTime", () => {
  it("formats in the target zone", () => {
    const value = formatAmeliaLocalDateTime(new Date("2026-11-13T18:05:00.000Z"), "UTC")
    expect(value).toBe("2026-11-13 18:05")
  })
})
