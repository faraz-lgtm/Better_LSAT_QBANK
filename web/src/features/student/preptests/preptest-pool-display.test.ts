import { describe, expect, it } from "vitest"

import {
  attemptScoreLabel,
  buildPoolHistoryRows,
  coercePoolScore,
  poolCardDisplayScore,
} from "@/features/student/preptests/preptest-pool-display"

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
})
