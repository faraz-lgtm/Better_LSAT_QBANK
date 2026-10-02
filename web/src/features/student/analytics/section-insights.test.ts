import { describe, expect, it } from "vitest"

import type { PracticeSessionSummary } from "@/lib/api/analytics"
import {
  buildSectionInsightAttempts,
  computeSectionInsightStats,
  formatSectionMissedSigned,
  sectionPtEquivalentScore,
  sortSectionInsightAttempts,
} from "@/features/student/analytics/section-insights"

function session(
  partial: Partial<PracticeSessionSummary> & Pick<PracticeSessionSummary, "id">,
): PracticeSessionSummary {
  return {
    kind: "SECTION",
    sectionType: "LR",
    startedAt: "2026-01-01T00:00:00Z",
    completedAt: "2026-01-01T01:00:00Z",
    rawScore: 20,
    scaledScore: 165,
    percentile: null,
    bookmarked: false,
    excluded: false,
    metadata: { questionCount: 25, sectionNumber: 3 },
    prepTestTitle: "PT 100",
    prepTestId: "pt-100",
    sectionTitle: "Section 3",
    ...partial,
  }
}

describe("formatSectionMissedSigned", () => {
  it("formats missed counts with a true minus", () => {
    expect(formatSectionMissedSigned(2)).toBe("\u22122")
    expect(formatSectionMissedSigned(6.9, 1)).toBe("\u22126.9")
    expect(formatSectionMissedSigned(0, 1)).toBe("0.0")
  })
})

describe("sectionPtEquivalentScore", () => {
  it("prefers a real scaled score when present", () => {
    expect(sectionPtEquivalentScore(20, 25, 168)).toBe(168)
  })

  it("maps raw accuracy onto 120–180 when scaled is missing", () => {
    expect(sectionPtEquivalentScore(25, 25, null)).toBe(180)
    expect(sectionPtEquivalentScore(0, 25, null)).toBe(120)
    expect(sectionPtEquivalentScore(12.5, 25, null)).toBe(150)
  })
})

describe("computeSectionInsightStats", () => {
  it("computes peak, trailing average, accuracy, and momentum", () => {
    const sessions = [
      session({ id: "a", completedAt: "2026-01-01T01:00:00Z", rawScore: 18, scaledScore: 160 }),
      session({ id: "b", completedAt: "2026-02-01T01:00:00Z", rawScore: 20, scaledScore: 165 }),
      session({ id: "c", completedAt: "2026-03-01T01:00:00Z", rawScore: 23, scaledScore: 170 }),
      session({ id: "d", completedAt: "2026-04-01T01:00:00Z", rawScore: 22, scaledScore: 168 }),
    ]
    const stats = computeSectionInsightStats(sessions, "LR")
    expect(stats).not.toBeNull()
    expect(stats!.peakMissed).toBe(2) // 25-23
    expect(stats!.attemptCount).toBe(4)
    expect(stats!.questionTotal).toBe(100)
    expect(stats!.correctTotal).toBe(83)
    expect(stats!.accuracyPct).toBe(83)
    // earlier half missed avg (7+5)/2=6, recent (2+3)/2=2.5 → momentum 3.5
    expect(stats!.momentum).toBe(3.5)
    expect(stats!.peakLabel).toContain("PT")
  })

  it("returns null with no matching sessions", () => {
    expect(computeSectionInsightStats([session({ id: "rc", sectionType: "RC" })], "LR")).toBeNull()
  })
})

describe("buildSectionInsightAttempts + sort", () => {
  it("builds newest-first attempts with untimed delta", () => {
    const rows = buildSectionInsightAttempts(
      [
        session({
          id: "a",
          completedAt: "2026-01-01T01:00:00Z",
          rawScore: 20,
          blindReviewRawScore: 24,
        }),
        session({
          id: "b",
          completedAt: "2026-02-01T01:00:00Z",
          rawScore: 22,
          blindReviewRawScore: 23,
        }),
      ],
      "LR",
    )
    expect(rows[0]?.id).toBe("b")
    expect(rows[0]?.untimedCorrect).toBe(23)
    expect(rows[0]?.untimedCorrectDelta).toBe(1)
    expect(rows[0]?.missed).toBe(3)
  })

  it("reads untimed review from section metadata when the column is empty", () => {
    const rows = buildSectionInsightAttempts(
      [
        session({
          id: "meta-br",
          completedAt: "2026-01-01T01:00:00Z",
          rawScore: 18,
          blindReviewRawScore: null,
          metadata: {
            questionCount: 25,
            sectionNumber: 3,
            sectionBlindReviewRawScore: 22,
          },
        }),
      ],
      "LR",
    )
    expect(rows[0]?.untimedCorrect).toBe(22)
    expect(rows[0]?.untimedCorrectDelta).toBe(4)
  })

  it("sorts by biggest gains using momentum", () => {
    const rows = buildSectionInsightAttempts(
      [
        session({ id: "a", completedAt: "2026-01-01T01:00:00Z", rawScore: 15 }),
        session({ id: "b", completedAt: "2026-02-01T01:00:00Z", rawScore: 16 }),
        session({ id: "c", completedAt: "2026-03-01T01:00:00Z", rawScore: 24 }),
      ],
      "LR",
    )
    const sorted = sortSectionInsightAttempts(rows, "gains")
    expect(sorted[0]?.id).toBe("c")
  })
})
