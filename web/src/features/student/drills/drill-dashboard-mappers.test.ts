import { describe, expect, it } from "vitest"

import type { PracticeSessionSummary } from "@/lib/api/analytics"

import {
  formatDrillTimeLabel,
  formatStudyTime,
  sessionStudyMinutes,
  sumCompletedSessionStudyMinutes,
} from "./drill-dashboard-mappers"

const baseSessionFields = {
  rawScore: null,
  scaledScore: null,
  percentile: null,
  bookmarked: false,
  excluded: false,
  prepTestTitle: null,
  sectionTitle: null,
  sectionType: null,
} satisfies Partial<PracticeSessionSummary>

describe("sessionStudyMinutes", () => {
  it("returns 0 for in-progress sessions", () => {
    expect(
      sessionStudyMinutes({
        startedAt: "2026-01-01T10:00:00Z",
        completedAt: null,
        metadata: { timing: "35" },
      }),
    ).toBe(0)
  })

  it("uses configured 35 minute budget for completed timed drills", () => {
    expect(
      sessionStudyMinutes({
        startedAt: "2026-01-01T10:00:00Z",
        completedAt: "2026-01-01T10:05:00Z",
        metadata: { timing: "35", questionCount: 10 },
      }),
    ).toBe(35)
  })

  it("computes per-question drill budgets from question count", () => {
    expect(
      sessionStudyMinutes({
        startedAt: "2026-01-01T10:00:00Z",
        completedAt: "2026-01-01T10:20:00Z",
        metadata: { timing: "per-q", questionCount: 5 },
      }),
    ).toBe(7)
  })

  it("uses elapsed minutes for unlimited completed sessions", () => {
    expect(
      sessionStudyMinutes({
        startedAt: "2026-01-01T10:00:00Z",
        completedAt: "2026-01-01T12:00:00Z",
        metadata: { timing: "unlimited" },
      }),
    ).toBe(120)
  })
})

describe("sumCompletedSessionStudyMinutes", () => {
  it("sums only completed session budgets", () => {
    const sessions: PracticeSessionSummary[] = [
      {
        id: "1",
        kind: "DRILL",
        startedAt: "2026-01-01T10:00:00Z",
        completedAt: "2026-01-01T10:30:00Z",
        metadata: { timing: "35" },
        ...baseSessionFields,
      },
      {
        id: "2",
        kind: "DRILL",
        startedAt: "2026-01-01T11:00:00Z",
        completedAt: null,
        metadata: { timing: "35" },
        ...baseSessionFields,
      },
    ]
    expect(sumCompletedSessionStudyMinutes(sessions)).toBe(35)
  })
})

describe("formatStudyTime", () => {
  it("shows minutes below one hour", () => {
    expect(formatStudyTime(35)).toBe("35 min")
  })

  it("shows whole hours without remainder", () => {
    expect(formatStudyTime(120)).toBe("2 hrs")
  })

  it("shows hours and minutes when mixed", () => {
    expect(formatStudyTime(95)).toBe("1h 35m")
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
