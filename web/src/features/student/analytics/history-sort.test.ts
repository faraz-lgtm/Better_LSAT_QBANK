import { describe, expect, it } from "vitest"

import { sortHistoryEntries, type HistorySortableEntry } from "@/features/student/analytics/history-sort"

function row(
  partial: Pick<HistorySortableEntry, "id"> & Partial<HistorySortableEntry>,
): HistorySortableEntry {
  return {
    score: 0,
    scoreMax: 25,
    takenAt: "2026-08-01T12:00:00Z",
    ...partial,
  }
}

describe("sortHistoryEntries", () => {
  const rows = [
    row({ id: "new-low", takenAt: "2026-08-27T12:00:00Z", score: 2, scoreMax: 25 }),
    row({ id: "old-high", takenAt: "2026-08-18T12:00:00Z", score: 22, scoreMax: 25 }),
    row({ id: "mid-zero", takenAt: "2026-08-20T08:00:00Z", score: 0, scoreMax: 25 }),
  ]

  it("orders Most recent and Oldest first by takenAt", () => {
    expect(sortHistoryEntries(rows, "date-desc").map((entry) => entry.id)).toEqual([
      "new-low",
      "mid-zero",
      "old-high",
    ])
    expect(sortHistoryEntries(rows, "date-asc").map((entry) => entry.id)).toEqual([
      "old-high",
      "mid-zero",
      "new-low",
    ])
  })

  it("orders Highest and Lowest score by score ratio", () => {
    expect(sortHistoryEntries(rows, "score-desc").map((entry) => entry.id)).toEqual([
      "old-high",
      "new-low",
      "mid-zero",
    ])
    expect(sortHistoryEntries(rows, "score-asc").map((entry) => entry.id)).toEqual([
      "mid-zero",
      "new-low",
      "old-high",
    ])
  })
})
