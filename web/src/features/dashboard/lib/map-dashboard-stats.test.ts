import { describe, expect, it } from "vitest"

import { formatStudyHours } from "@/features/student/drills/drill-dashboard-mappers"

import { mapOverviewToDashboardStats } from "./map-dashboard-stats"

describe("map-dashboard-stats", () => {
  it("maps overview and study hours to three stat cards", () => {
    const cards = mapOverviewToDashboardStats(
      {
        bestScaledScore: 170,
        averageScaledScore: 165,
        bestPercentile: 90,
        averagePercentile: 85,
        completedPrepTestCount: 2,
        totalQuestionsAnswered: 500,
        drillAccuracyPct: 78,
        totalDrillQuestionsAnswered: 200,
        averageLrMissedPerPrepTest: 5,
        averageRcMissedPerPrepTest: 3,
      },
      142.4,
    )
    expect(cards).toHaveLength(3)
    expect(cards[0]?.value).toBe("142h")
    expect(cards[1]?.value).toBe("78%")
    expect(cards[2]?.value).toBe("500")
  })

  it("shows em dash when drill accuracy is null", () => {
    const cards = mapOverviewToDashboardStats(
      {
        bestScaledScore: null,
        averageScaledScore: null,
        bestPercentile: null,
        averagePercentile: null,
        completedPrepTestCount: 0,
        totalQuestionsAnswered: 0,
        drillAccuracyPct: null,
        totalDrillQuestionsAnswered: 0,
        averageLrMissedPerPrepTest: null,
        averageRcMissedPerPrepTest: null,
      },
      0,
    )
    expect(cards[1]?.value).toBe("—")
  })
})

describe("formatStudyHours", () => {
  it("formats fractional hours below 1", () => {
    expect(formatStudyHours(0.5)).toBe("0.5h")
  })

  it("rounds whole hours", () => {
    expect(formatStudyHours(142.4)).toBe("142h")
  })
})
