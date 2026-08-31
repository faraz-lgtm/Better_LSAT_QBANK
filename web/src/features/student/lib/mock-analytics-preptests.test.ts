import { describe, expect, it } from "vitest"

import { withSessionBookmark } from "@/features/student/analytics/session-bookmarks"
import {
  getPrepTestHistoryEntries,
  sortPrepTestRecords,
  type PrepTestRecord,
} from "@/features/student/lib/mock-analytics-preptests"

function record(partial: Partial<PrepTestRecord> & Pick<PrepTestRecord, "id" | "takenAt">): PrepTestRecord {
  return {
    prepTestNumber: 100,
    bookmarked: false,
    lrCorrect: 0,
    lrMax: 51,
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
