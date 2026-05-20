import { describe, expect, it } from "vitest"

import type { PracticeSessionSummary } from "@/lib/api/analytics"

import { sumSessionStudyHours } from "./drill-dashboard-mappers"

describe("sumSessionStudyHours", () => {
  it("sums completed session durations in hours", () => {
    const sessions: PracticeSessionSummary[] = [
      {
        id: "1",
        kind: "DRILL",
        startedAt: "2026-01-01T10:00:00Z",
        completedAt: "2026-01-01T12:00:00Z",
        rawScore: null,
        scaledScore: null,
        percentile: null,
        bookmarked: false,
        excluded: false,
        metadata: {},
        prepTestTitle: null,
        sectionTitle: null,
        sectionType: null,
      },
    ]
    expect(sumSessionStudyHours(sessions)).toBe(2)
  })

  it("uses now for in-progress sessions", () => {
    const now = new Date("2026-01-01T13:00:00Z").getTime()
    const sessions: PracticeSessionSummary[] = [
      {
        id: "1",
        kind: "DRILL",
        startedAt: "2026-01-01T12:00:00Z",
        completedAt: null,
        rawScore: null,
        scaledScore: null,
        percentile: null,
        bookmarked: false,
        excluded: false,
        metadata: {},
        prepTestTitle: null,
        sectionTitle: null,
        sectionType: null,
      },
    ]
    expect(sumSessionStudyHours(sessions, now)).toBe(1)
  })
})
