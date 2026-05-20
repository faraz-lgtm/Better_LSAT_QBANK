import { describe, expect, it } from "vitest"

import {
  mapOverviewToHeadlineStats,
  mapTrajectoryToScoreProgress,
  mapPrioritiesToSections,
} from "@/features/student/analytics/map-analytics"
import type { AnalyticsOverview, PriorityRow, TrajectoryPoint } from "@/lib/api/analytics"

describe("map-analytics", () => {
  it("maps overview to headline stats with percentiles", () => {
    const overview: AnalyticsOverview = {
      bestScaledScore: 170,
      averageScaledScore: 165,
      bestPercentile: 92,
      averagePercentile: 80,
      completedPrepTestCount: 2,
      totalQuestionsAnswered: 100,
      drillAccuracyPct: 70,
      totalDrillQuestionsAnswered: 50,
      averageLrMissedPerPrepTest: 5,
      averageRcMissedPerPrepTest: 6,
    }
    const stats = mapOverviewToHeadlineStats(overview)
    expect(stats[0]?.value).toBe("170")
    expect(stats[0]?.caption).toContain("92")
  })

  it("maps trajectory to score progress with blind review", () => {
    const points: TrajectoryPoint[] = [
      {
        sessionId: "s1",
        prepTestTitle: "PT 150",
        moduleId: null,
        rawScore: 80,
        scaledScore: 160,
        percentile: 50,
        regularRawScore: 80,
        regularScaledScore: 160,
        blindReviewRawScore: 85,
        blindReviewScaledScore: 165,
        blindReviewPercentile: 55,
        completedAt: "2026-01-01T00:00:00Z",
      },
    ]
    const mapped = mapTrajectoryToScoreProgress(points)
    expect(mapped[0]?.regular).toBe(89)
    expect(mapped[0]?.blindReview).toBe(92)
  })

  it("groups priorities into LR and RC sections", () => {
    const priorities: PriorityRow[] = [
      {
        questionTypeId: "qt-1",
        name: "Flaw",
        sectionType: "LR",
        attemptCount: 10,
        correctCount: 5,
        accuracyPct: 50,
        goalAccuracy: 86,
        gap: 36,
        priorityLevel: "high",
        difficulty: 3,
        averagePerTest: 9,
        reviewCount: 10,
      },
    ]
    const sections = mapPrioritiesToSections(priorities)
    expect(sections).toHaveLength(1)
    expect(sections[0]?.id).toBe("LR")
    expect(sections[0]?.rows[0]?.id).toBe("qt-1")
  })
})
