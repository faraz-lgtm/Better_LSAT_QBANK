import { describe, expect, it } from "vitest"

import type { PracticeSessionSummary } from "@/lib/api/analytics"

import {
  formatDrillTimeLabel,
  sumSessionStudyHours,
} from "./drill-dashboard-mappers"

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

describe("formatDrillTimeLabel", () => {
  const baseSession = {
    startedAt: "2026-01-01T12:00:00Z",
    completedAt: null as string | null,
  }

  it("shows configured 35 minute drills as 35 min", () => {
    expect(formatDrillTimeLabel(baseSession, { timing: "35", questionCount: 10 })).toBe("35 min")
  })

  it("computes per-question drill budgets from question count", () => {
    expect(formatDrillTimeLabel(baseSession, { timing: "per-q", questionCount: 5 })).toBe("7 min")
  })

  it("shows elapsed time instead of raw unlimited", () => {
    const now = new Date("2026-01-01T12:15:00Z").getTime()
    expect(formatDrillTimeLabel(baseSession, { timing: "unlimited" }, now)).toBe("15 min")
  })

  it("formats long unlimited sessions in hours", () => {
    const now = new Date("2026-01-01T14:30:00Z").getTime()
    expect(formatDrillTimeLabel(baseSession, { timing: "unlimited" }, now)).toBe("2h 30m")
  })
})
