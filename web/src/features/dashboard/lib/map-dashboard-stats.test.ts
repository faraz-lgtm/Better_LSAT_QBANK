import { describe, expect, it } from "vitest"

import { formatStudyTime } from "@/features/student/drills/drill-dashboard-mappers"

import {
  daysUntilDate,
  formatTestDateInputValue,
  mapOverviewToDashboardStats,
  mapOverviewToPerformance,
} from "./map-dashboard-stats"

const sampleOverview = {
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
}

describe("map-dashboard-stats", () => {
  it("maps overview to four quick-stat cards", () => {
    const cards = mapOverviewToDashboardStats(sampleOverview)
    expect(cards).toHaveLength(4)
    expect(cards[0]?.label).toBe("Total Study Time")
    expect(cards[0]?.value).toBe("1h")
    expect(cards[1]?.label).toBe("Questions Done")
    expect(cards[1]?.value).toBe("500")
    expect(cards[2]?.label).toBe("Avg Time / Q")
    expect(cards[2]?.value).toBe("0:11")
    expect(cards[3]?.label).toBe("Overall Accuracy")
    expect(cards[3]?.value).toBe("78%")
  })

  it("shows em dash when drill accuracy is null", () => {
    const cards = mapOverviewToDashboardStats({
      ...sampleOverview,
      drillAccuracyPct: null,
      totalQuestionsAnswered: 0,
      totalStudyMinutes: 0,
    })
    expect(cards[3]?.value).toBe("—")
    expect(cards[2]?.value).toBe("—")
  })

  it("maps performance overview metrics", () => {
    const performance = mapOverviewToPerformance(sampleOverview)
    expect(performance.practiceTestCount).toBe(2)
    expect(performance.metrics.find((m) => m.id === "avg-score")?.value).toBe("165")
    expect(performance.metrics.find((m) => m.id === "percentile")?.value).toBe("85th")
    expect(performance.metrics.find((m) => m.id === "avg-lr")?.value).toBe("-5")
    expect(performance.metrics.find((m) => m.id === "avg-rc")?.value).toBe("-3")
    expect(performance.metrics.find((m) => m.id === "questions-drilled")?.value).toBe("200")
    expect(performance.metrics.find((m) => m.id === "drilled-accuracy")?.value).toBe("78%")
  })

  it("computes days until a planned test date", () => {
    expect(daysUntilDate("2026-08-01", new Date("2026-07-28T12:00:00"))).toBe(4)
    expect(daysUntilDate(null)).toBeNull()
  })

  it("formats test date for the countdown input", () => {
    expect(formatTestDateInputValue("2027-01-01")).toBe("01/01/2027")
    expect(formatTestDateInputValue(null)).toBe("—")
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
