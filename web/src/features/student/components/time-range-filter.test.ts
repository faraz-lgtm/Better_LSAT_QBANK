import { describe, expect, it } from "vitest"

import {
  filterByTimeRange,
  getTimeRangeCutoff,
  type TimeRangeValue,
} from "@/features/student/components/time-range-filter"

type Row = { id: string; at: string }

const ROWS: Row[] = [
  { id: "jan", at: "2026-01-10T12:00:00.000Z" },
  { id: "feb", at: "2026-02-15T12:00:00.000Z" },
  { id: "mar", at: "2026-03-20T12:00:00.000Z" },
  { id: "sep", at: "2026-09-25T12:00:00.000Z" },
]

describe("getTimeRangeCutoff", () => {
  const reference = new Date("2026-09-30T12:00:00.000Z")

  it("returns null for all-time", () => {
    expect(getTimeRangeCutoff("all", reference)).toBeNull()
  })

  it("computes rolling day windows from reference", () => {
    expect(getTimeRangeCutoff("7d", reference)?.toISOString()).toBe("2026-09-23T12:00:00.000Z")
    expect(getTimeRangeCutoff("30d", reference)?.toISOString()).toBe("2026-08-31T12:00:00.000Z")
    expect(getTimeRangeCutoff("90d", reference)?.toISOString()).toBe("2026-07-02T12:00:00.000Z")
  })

  it("uses Jan 1 of the reference year for ytd", () => {
    expect(getTimeRangeCutoff("ytd", reference)).toEqual(new Date(2026, 0, 1))
  })
})

describe("filterByTimeRange", () => {
  const reference = new Date("2026-09-30T12:00:00.000Z")

  function ids(value: TimeRangeValue, keepNewestIfEmpty = false): string[] {
    return filterByTimeRange(ROWS, value, (row) => row.at, { reference, keepNewestIfEmpty }).map(
      (row) => row.id,
    )
  }

  it("keeps all rows for all-time", () => {
    expect(ids("all")).toEqual(["jan", "feb", "mar", "sep"])
  })

  it("filters by calendar last-30-days", () => {
    expect(ids("30d")).toEqual(["sep"])
  })

  it("filters by calendar last-90-days", () => {
    expect(ids("90d")).toEqual(["sep"])
  })

  it("keeps year-to-date rows", () => {
    expect(ids("ytd")).toEqual(["jan", "feb", "mar", "sep"])
  })

  it("returns empty when nothing matches unless keepNewestIfEmpty", () => {
    const oldOnly: Row[] = [
      { id: "ancient", at: "2025-01-01T12:00:00.000Z" },
      { id: "old", at: "2025-06-01T12:00:00.000Z" },
    ]
    expect(
      filterByTimeRange(oldOnly, "7d", (row) => row.at, { reference }).map((row) => row.id),
    ).toEqual([])
    expect(
      filterByTimeRange(oldOnly, "7d", (row) => row.at, {
        reference,
        keepNewestIfEmpty: true,
      }).map((row) => row.id),
    ).toEqual(["old"])
  })

  it("drops rows without parseable dates", () => {
    const mixed = [
      { id: "ok", at: "2026-09-20T00:00:00.000Z" },
      { id: "bad", at: "not-a-date" },
      { id: "missing", at: "" },
    ]
    expect(
      filterByTimeRange(mixed, "30d", (row) => row.at || null, { reference }).map((row) => row.id),
    ).toEqual(["ok"])
  })
})
