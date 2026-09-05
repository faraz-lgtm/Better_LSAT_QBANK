import { describe, expect, it } from "vitest"

import { withSessionBookmark } from "@/features/student/analytics/session-bookmarks"
import {
  computePrepTestStats,
  getPrepTestHistoryEntries,
  sortPrepTestRecords,
  type PrepTestRecord,
} from "@/features/student/lib/mock-analytics-preptests"

function record(partial: Partial<PrepTestRecord> & Pick<PrepTestRecord, "id" | "takenAt">): PrepTestRecord {
  return {
    prepTestNumber: 100,
    bookmarked: false,
    lrCorrect: 0,
    lrMax: 26,
    rcCorrect: 0,
    rcMax: 27,
    scaledScore: 120,
    percentile: 0,
    blindReviewScaled: 120,
    blindReviewPercentile: 0,
    ...partial,
  }
}

describe("PrepTest history sort and bookmarks", () => {
  const rows = [
    record({ id: "pt141", prepTestNumber: 141, takenAt: "2026-08-27T12:00:00Z", rcCorrect: 0, bookmarked: true }),
    record({ id: "pt143", prepTestNumber: 143, takenAt: "2026-08-18T12:00:00Z", rcCorrect: 22, bookmarked: true }),
    record({ id: "pt150", prepTestNumber: 150, takenAt: "2026-08-18T08:00:00Z", rcCorrect: 0, bookmarked: false }),
  ]

  it("keeps oldest-first order when mapping to history rows", () => {
    const sorted = sortPrepTestRecords(rows, "date-asc")
    const entries = getPrepTestHistoryEntries(sorted)
    expect(entries.map((entry) => entry.testLabel)).toEqual(["PT150", "PT143", "PT141"])
  })

  it("reverses Most recent vs Oldest first", () => {
    expect(sortPrepTestRecords(rows, "date-desc").map((row) => row.id)).toEqual([
      "pt141",
      "pt143",
      "pt150",
    ])
    expect(sortPrepTestRecords(rows, "date-asc").map((row) => row.id)).toEqual([
      "pt150",
      "pt143",
      "pt141",
    ])
  })

  it("sorts highest displayed score first", () => {
    const entries = getPrepTestHistoryEntries(sortPrepTestRecords(rows, "score-desc"))
    expect(entries.map((entry) => entry.testLabel)).toEqual(["PT143", "PT141", "PT150"])
  })

  it("reflects bookmark toggles on the following history rows", () => {
    const next = withSessionBookmark(rows, "pt150", true)
    const entries = getPrepTestHistoryEntries(next)
    expect(entries.find((entry) => entry.id === "pt150")?.bookmarked).toBe(true)
    expect(entries.find((entry) => entry.id === "pt141")?.bookmarked).toBe(true)
  })
})

describe("computePrepTestStats LawHub LR/RC averages", () => {
  it("never treats the old combined LR max of 51 as a valid average", () => {
    const stats = computePrepTestStats([
      record({
        id: "placeholder",
        takenAt: "2026-01-01T00:00:00Z",
        lrCorrect: 0,
        lrMax: 51,
        rcCorrect: 80,
        rcMax: 27,
        scaledScore: 121,
        percentile: 8,
      }),
      record({
        id: "real",
        takenAt: "2026-01-02T00:00:00Z",
        lrCorrect: 20,
        lrMax: 25,
        rcCorrect: 18,
        rcMax: 27,
        scaledScore: 160,
        percentile: 80,
      }),
    ])
    expect(stats?.averageLrMissed).toBe(-5)
    expect(stats?.averageLrMissed).not.toBe(-51)
    expect(stats?.averageRcMissed).toBe(-9)
  })

  it("omits AVERAGE LR when no LawHub-valid LR section stats exist", () => {
    const stats = computePrepTestStats([
      record({
        id: "unknown",
        takenAt: "2026-01-01T00:00:00Z",
        lrCorrect: 0,
        lrMax: 0,
        rcCorrect: 0,
        rcMax: 0,
        scaledScore: 121,
      }),
    ])
    expect(stats?.averageLrMissed).toBeNull()
    expect(stats?.averageRcMissed).toBeNull()
  })
})
