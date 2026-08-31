import { describe, expect, it } from "vitest"

import {
  adjustPrepTestPoolStatusCounts,
  adjustPrepTestPoolTotal,
  attemptScoreLabel,
  buildPoolHistoryRows,
  coercePoolScore,
  filterPrepTestPoolItems,
  isPrepTestInProcess,
  poolCardDisplayScore,
} from "@/features/student/preptests/preptest-pool-display"
import type { PrepTestPoolItem } from "@/features/student/preptests/preptest-types"

describe("preptest-pool-display", () => {
  it("coerces string scores from legacy API payloads", () => {
    expect(coercePoolScore("160")).toBe(160)
    expect(coercePoolScore(null)).toBeNull()
  })

  it("builds attempt history with BR score label", () => {
    const rows = buildPoolHistoryRows(
      {
        id: "pt-1",
        openPrepTestSessionId: null,
        completedAt: "2026-01-01T00:00:00Z",
        scaledScore: 139,
        blindReviewScaledScore: 139,
        attempts: [
          {
            sessionId: "sess-2",
            completedAt: "2026-01-10T00:00:00Z",
            scaledScore: 160,
            blindReviewScaledScore: null,
            attemptNumber: 2,
          },
          {
            sessionId: "sess-1",
            completedAt: "2026-01-01T00:00:00Z",
            scaledScore: 139,
            blindReviewScaledScore: 139,
            attemptNumber: 1,
          },
        ],
      },
      { includeFallback: true },
    )

    expect(rows).toHaveLength(2)
    expect(poolCardDisplayScore({ scaledScore: 160, blindReviewScaledScore: null }, rows[0]!)).toBe(160)
    expect(attemptScoreLabel(rows[1]!)).toBe("139 · 139 BR")
  })

  it("hydrates missing attempt scores from the pool item", () => {
    const rows = buildPoolHistoryRows(
      {
        id: "pt-1",
        openPrepTestSessionId: "sess-1",
        completedAt: "2026-01-01T00:00:00Z",
        scaledScore: 160,
        blindReviewScaledScore: null,
        attempts: [
          {
            sessionId: "sess-1",
            completedAt: "2026-01-01T00:00:00Z",
            scaledScore: null,
            blindReviewScaledScore: null,
            attemptNumber: 1,
          },
        ],
      },
      { includeFallback: true },
    )

    expect(poolCardDisplayScore({ scaledScore: 160, blindReviewScaledScore: null }, rows[0]!, rows)).toBe(160)
    expect(attemptScoreLabel(rows[0]!)).toBe("160")
  })

  it("treats paused takes as in process and Blind Review as a separate filter", () => {
    const paused: PrepTestPoolItem = {
      id: "pt-158",
      moduleId: "LSAC158",
      title: "PT 158",
      prepTestNumber: "158",
      questionCount: 103,
      sectionCount: 4,
      practiceableSectionCount: 4,
      timeMinutes: 140,
      status: "in_progress",
      scaledScore: null,
      blindReviewScaledScore: null,
      blindReviewStatus: null,
      completedAt: null,
      attempts: [],
      openPrepTestSessionId: "sess-open",
    }
    const blindReview: PrepTestPoolItem = {
      ...paused,
      id: "pt-154",
      prepTestNumber: "154",
      blindReviewStatus: "in_progress",
      openPrepTestSessionId: "sess-br",
    }
    const counts = { all: 2, fresh: 0, in_progress: 2, completed: 0, blind_review: 1 }

    expect(isPrepTestInProcess(paused)).toBe(true)
    expect(isPrepTestInProcess(blindReview)).toBe(false)
    expect(filterPrepTestPoolItems([paused, blindReview], "in_progress")).toEqual([paused])
    expect(filterPrepTestPoolItems([paused, blindReview], "blind_review")).toEqual([blindReview])
    expect(adjustPrepTestPoolStatusCounts(counts, [paused, blindReview], "in_progress").in_progress).toBe(1)
    expect(adjustPrepTestPoolTotal(2, counts, [paused, blindReview], "in_progress")).toBe(1)
    expect(adjustPrepTestPoolStatusCounts(counts, [paused], "in_progress").in_progress).toBe(2)
  })
})
