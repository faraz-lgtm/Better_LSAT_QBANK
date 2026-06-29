import { describe, expect, it } from "vitest"

import { formatStudyTime } from "@/features/student/drills/drill-dashboard-mappers"

import { mapOverviewToDashboardStats } from "./map-dashboard-stats"

describe("map-dashboard-stats", () => {
  it("maps overview and study minutes to three stat cards", () => {
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
        totalStudyMinutes: 95,
      },
    )
    expect(cards).toHaveLength(3)
    expect(cards[0]?.value).toBe("1h 35m")
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
        totalStudyMinutes: 0,
      },
    )
    expect(cards[1]?.value).toBe("—")
  })
})

describe("formatStudyTime", () => {
  it("formats minutes below one hour", () => {
    expect(formatStudyTime(35)).toBe("35 min")
  })

  it("formats invalid values as zero minutes", () => {
    expect(formatStudyTime(Number.NaN)).toBe("0 min")
    expect(formatStudyTime(undefined as unknown as number)).toBe("0 min")
  })

  it("formats whole hours", () => {
    expect(formatStudyTime(180)).toBe("3 hrs")
  })
})
