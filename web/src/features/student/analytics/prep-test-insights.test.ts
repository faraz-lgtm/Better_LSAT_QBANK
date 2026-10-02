import { describe, expect, it } from "vitest"

import {
  buildPrepTestInsightLogRows,
  computePrepTestInsightStats,
  computePrepTestMomentum,
  computeSectionDropoffPct,
  rollingAverageSeries,
  sectionTone,
  sortInsightLogRows,
} from "@/features/student/analytics/prep-test-insights"
import { mockPrepTestRecords } from "@/features/student/lib/mock-analytics-preptests"
import type { PrepTestRecord } from "@/features/student/lib/mock-analytics-preptests"

function withSections(
  base: PrepTestRecord,
  sections: PrepTestRecord["sections"],
): PrepTestRecord {
  return { ...base, sections }
}

describe("computePrepTestInsightStats", () => {
  it("computes peak, target gap, and variance from scaled PrepTests", () => {
    const stats = computePrepTestInsightStats(mockPrepTestRecords, 170)
    expect(stats).not.toBeNull()
    expect(stats!.peakScore).toBe(169)
    expect(stats!.peakPercentile).toBe(94)
    expect(stats!.goalScore).toBe(170)
    expect(stats!.averageScore).toBeGreaterThan(0)
    expect(stats!.targetGap).toBe(Number(((stats!.averageScore! - 170) * 10).toFixed(1)) / 10)
    expect(stats!.variancePts).toBeGreaterThanOrEqual(0)
    expect(stats!.varianceLow).toBeLessThanOrEqual(stats!.varianceHigh!)
  })

  it("defaults goal to 170 when unset", () => {
    const stats = computePrepTestInsightStats(mockPrepTestRecords, null)
    expect(stats?.goalScore).toBe(170)
  })

  it("returns null when there are no scaled scores", () => {
    const rawOnly: PrepTestRecord[] = [
      {
        ...mockPrepTestRecords[0]!,
        hasScaledScore: false,
        scaledScore: 0,
      },
    ]
    expect(computePrepTestInsightStats(rawOnly, 170)).toBeNull()
  })
})

describe("computeSectionDropoffPct", () => {
  it("averages S4 accuracy minus mean(S1–S3)", () => {
    const records = [
      withSections(mockPrepTestRecords[0]!, [
        { number: 1, correct: 20, max: 25 },
        { number: 2, correct: 20, max: 25 },
        { number: 3, correct: 20, max: 25 },
        { number: 4, correct: 10, max: 25 },
      ]),
    ]
    // early avg 80%, late 40% → -40
    expect(computeSectionDropoffPct(records)).toBe(-40)
  })

  it("returns null without four sections", () => {
    const records = [
      withSections(mockPrepTestRecords[0]!, [
        { number: 1, correct: 20, max: 25 },
        { number: 2, correct: 20, max: 25 },
      ]),
    ]
    expect(computeSectionDropoffPct(records)).toBeNull()
  })
})

describe("computePrepTestMomentum", () => {
  it("subtracts the mean of up to the previous 5 chronological scores", () => {
    const chronological = [...mockPrepTestRecords].sort(
      (a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt),
    )
    const last = chronological[chronological.length - 1]!
    const prior = chronological.slice(-6, -1).map((r) => r.scaledScore)
    const expected =
      Math.round((last.scaledScore - prior.reduce((s, v) => s + v, 0) / prior.length) * 10) / 10
    expect(computePrepTestMomentum(last, chronological)).toBe(expected)
  })

  it("returns null for the first scaled attempt", () => {
    const chronological = [...mockPrepTestRecords].sort(
      (a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt),
    )
    expect(computePrepTestMomentum(chronological[0]!, chronological)).toBeNull()
  })
})

describe("rollingAverageSeries", () => {
  it("builds a trailing window average", () => {
    expect(rollingAverageSeries([10, 20, 30], 2)).toEqual([10, 15, 25])
  })
})

describe("buildPrepTestInsightLogRows + sort", () => {
  it("builds newest-first log rows with momentum and untimed delta", () => {
    const rows = buildPrepTestInsightLogRows(mockPrepTestRecords)
    expect(rows[0]?.testLabel.startsWith("PT")).toBe(true)
    expect(Date.parse(rows[0]!.takenAt)).toBeGreaterThanOrEqual(Date.parse(rows[1]!.takenAt))
    const withMomentum = rows.find((row) => row.momentum != null)
    expect(withMomentum).toBeTruthy()
  })

  it("sorts by strongest momentum", () => {
    const rows = buildPrepTestInsightLogRows(mockPrepTestRecords)
    const sorted = sortInsightLogRows(rows, "momentum")
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1]!.momentum ?? Number.NEGATIVE_INFINITY
      const next = sorted[i]!.momentum ?? Number.NEGATIVE_INFINITY
      expect(prev).toBeGreaterThanOrEqual(next)
    }
  })
})

describe("sectionTone", () => {
  it("marks a section weak when clearly below sibling average", () => {
    const sections = [
      { number: 1, correct: 22, max: 25 },
      { number: 2, correct: 22, max: 25 },
      { number: 3, correct: 22, max: 25 },
      { number: 4, correct: 12, max: 25 },
    ]
    expect(sectionTone(sections[3]!, sections)).toBe("weak")
    expect(sectionTone(sections[0]!, sections)).toBe("strong")
  })
})
