import { describe, expect, it } from "vitest"

import {
  formatPrepTestChartLabel,
  formatPrepTestHistoryLabel,
  mapOverviewToHeadlineStats,
  mapPrepTestSessionToHistoryEntry,
  mapTrajectoryToScoreProgress,
  mapPrioritiesToSections,
} from "@/features/student/analytics/map-analytics"
import type { AnalyticsOverview, PracticeSessionSummary, PriorityRow, TrajectoryPoint } from "@/lib/api/analytics"

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
      totalStudyMinutes: 0,
    }
    const stats = mapOverviewToHeadlineStats(overview)
    expect(stats[0]?.value).toBe("170")
    expect(stats[0]?.caption).toContain("92nd")
  })

  it("formats prep test chart labels as PT numbers", () => {
    expect(formatPrepTestChartLabel("Local Seed — PrepTest Alpha", "LSAC150")).toBe("PT 150")
    expect(formatPrepTestChartLabel("PrepTest 129", null)).toBe("PT 129")
    expect(formatPrepTestChartLabel("PT 101", null)).toBe("PT 101")
  })

  it("formats prep test history labels as compact PT numbers", () => {
    expect(formatPrepTestHistoryLabel("The Official LSAT PrepTest 118", null)).toBe("PT118")
    expect(formatPrepTestHistoryLabel("Local Seed — PrepTest Alpha", "LSAC150")).toBe("PT150")
    expect(mapPrepTestSessionToHistoryEntry({
      id: "s1",
      kind: "PREPTEST",
      prepTestId: "LSAC158",
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-02T00:00:00Z",
      rawScore: 80,
      scaledScore: 160,
      percentile: 50,
      bookmarked: false,
      excluded: false,
      metadata: {},
      prepTestTitle: "The Official LSAT PrepTest 158",
      sectionTitle: null,
      sectionType: null,
    } satisfies PracticeSessionSummary)?.testLabel).toBe("PT158")
  })

  it("maps trajectory labels to PT numbers from module id", () => {
    const points: TrajectoryPoint[] = [
      {
        sessionId: "s1",
        prepTestTitle: "Local Seed — PrepTest Alpha",
        moduleId: "LSAC150",
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
    expect(mapped[0]?.test).toBe("PT 150")
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
