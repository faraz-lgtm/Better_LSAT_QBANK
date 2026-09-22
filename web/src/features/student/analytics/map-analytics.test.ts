import { describe, expect, it } from "vitest"

import {
  formatOverviewPercentileCaption,
  formatPrepTestChartLabel,
  formatPrepTestHistoryLabel,
  formatSectionHistoryLabel,
  mapDrillSessionToHistoryEntry,
  mapOverviewToHeadlineStats,
  mapPrepTestSessionToHistoryEntry,
  mapSectionSessionToHistoryEntry,
  mapSessionToDrillRecord,
  mapSessionToPrepTestRecord,
  mapTrajectoryToScoreProgress,
  mapPrioritiesToSections,
  withBestScoreFromTrajectory,
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

  it("formats overview percentile captions with ordinals", () => {
    expect(formatOverviewPercentileCaption(99)).toBe("PERCENTILE: 99th")
    expect(formatOverviewPercentileCaption(11)).toBe("PERCENTILE: 11th")
    expect(formatOverviewPercentileCaption(90.6)).toBe("PERCENTILE: 90.6th")
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

  it("keeps the practice session id and PrepTest id separate on Insights records", () => {
    const record = mapSessionToPrepTestRecord({
      id: "sess-1",
      kind: "PREPTEST",
      prepTestId: "pt-157",
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-02T00:00:00Z",
      rawScore: 80,
      scaledScore: 160,
      percentile: 50,
      bookmarked: false,
      excluded: false,
      metadata: {},
      prepTestTitle: "The Official LSAT PrepTest 157",
      sectionTitle: null,
      sectionType: null,
    })
    expect(record?.id).toBe("sess-1")
    expect(record?.prepTestId).toBe("pt-157")
    expect(record?.lrMax).not.toBe(51)
    expect(record?.lrCorrect).toBe(0)
    expect(record?.lrMax).toBe(0)
    expect(record?.rcCorrect).not.toBe(80)
    expect(record?.rawScore).toBe(80)
    expect(record?.rawMax).toBe(80)
    expect(record?.scaledScore).toBe(160)
    expect(record?.hasScaledScore).toBe(true)
  })

  it("maps PrepTest LR/RC from scored section sessions, not a combined 51-question LR", () => {
    const record = mapSessionToPrepTestRecord(
      {
        id: "sess-1",
        kind: "PREPTEST",
        prepTestId: "pt-157",
        startedAt: "2026-01-01T00:00:00Z",
        completedAt: "2026-01-02T00:00:00Z",
        rawScore: 38,
        scaledScore: 160,
        percentile: 50,
        bookmarked: false,
        excluded: false,
        metadata: {},
        prepTestTitle: "The Official LSAT PrepTest 157",
        sectionTitle: null,
        sectionType: null,
      },
      [
        {
          id: "lr-1",
          kind: "SECTION",
          prepTestId: "pt-157",
          startedAt: "2026-01-01T00:10:00Z",
          completedAt: "2026-01-01T00:45:00Z",
          rawScore: 20,
          scaledScore: null,
          percentile: null,
          bookmarked: false,
          excluded: false,
          metadata: { questionCount: 25 },
          prepTestTitle: null,
          sectionTitle: "Logical Reasoning",
          sectionType: "LR",
        },
        {
          id: "rc-1",
          kind: "SECTION",
          prepTestId: "pt-157",
          startedAt: "2026-01-01T00:50:00Z",
          completedAt: "2026-01-01T01:25:00Z",
          rawScore: 18,
          scaledScore: null,
          percentile: null,
          bookmarked: false,
          excluded: false,
          metadata: { questionCount: 27 },
          prepTestTitle: null,
          sectionTitle: "Reading Comprehension",
          sectionType: "RC",
        },
      ],
    )
    expect(record).toMatchObject({
      lrCorrect: 20,
      lrMax: 25,
      rcCorrect: 18,
      rcMax: 27,
      rawScore: 38,
      rawMax: 52,
      scaledScore: 160,
      hasScaledScore: true,
    })
  })

  it("keeps raw PrepTest scores when no scaled conversion exists", () => {
    const record = mapSessionToPrepTestRecord({
      id: "sess-raw",
      kind: "PREPTEST",
      prepTestId: "pt-120",
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-02T00:00:00Z",
      rawScore: 41,
      scaledScore: null,
      percentile: null,
      bookmarked: false,
      excluded: false,
      metadata: {},
      prepTestTitle: "The Official LSAT PrepTest 120",
      sectionTitle: null,
      sectionType: null,
    })
    expect(record).toMatchObject({
      rawScore: 41,
      rawMax: 41,
      scaledScore: 0,
      hasScaledScore: false,
    })
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
    expect(mapped[0]?.regular).toBe(160)
    expect(mapped[0]?.blindReview).toBe(165)
  })

  it("lifts headline best score from a higher untimed-review trajectory point", () => {
    const overview: AnalyticsOverview = {
      bestScaledScore: 161,
      averageScaledScore: 123,
      bestPercentile: 76,
      averagePercentile: 10,
      completedPrepTestCount: 31,
      totalQuestionsAnswered: 100,
      drillAccuracyPct: 70,
      totalDrillQuestionsAnswered: 50,
      averageLrMissedPerPrepTest: 23,
      averageRcMissedPerPrepTest: 25,
      totalStudyMinutes: 0,
    }
    const lifted = withBestScoreFromTrajectory(overview, [
      {
        sessionId: "s1",
        prepTestTitle: "PrepTest 158",
        moduleId: "LSAC158",
        rawScore: 80,
        scaledScore: 161,
        percentile: 76,
        regularRawScore: 80,
        regularScaledScore: 161,
        blindReviewRawScore: 99,
        blindReviewScaledScore: 176,
        blindReviewPercentile: 99.9,
        completedAt: "2026-01-01T00:00:00Z",
      },
    ])
    expect(lifted.bestScaledScore).toBe(176)
    expect(lifted.bestPercentile).toBe(99.9)
    expect(lifted.averageScaledScore).toBe(123)
  })

  it("lifts headline best score from a higher stored timed trajectory point", () => {
    const overview: AnalyticsOverview = {
      bestScaledScore: 161,
      averageScaledScore: 123,
      bestPercentile: 76,
      averagePercentile: 10,
      completedPrepTestCount: 1,
      totalQuestionsAnswered: 100,
      drillAccuracyPct: 70,
      totalDrillQuestionsAnswered: 50,
      averageLrMissedPerPrepTest: 5,
      averageRcMissedPerPrepTest: 6,
      totalStudyMinutes: 0,
    }
    const lifted = withBestScoreFromTrajectory(overview, [
      {
        sessionId: "s1",
        prepTestTitle: "PrepTest 158",
        moduleId: "LSAC158",
        rawScore: 99,
        scaledScore: 176,
        percentile: 99.9,
        regularRawScore: 99,
        regularScaledScore: 176,
        blindReviewRawScore: null,
        blindReviewScaledScore: null,
        blindReviewPercentile: null,
        completedAt: "2026-01-01T00:00:00Z",
      },
    ])
    expect(lifted.bestScaledScore).toBe(176)
    expect(lifted.bestPercentile).toBe(99.9)
  })

  it("groups priorities into LR and RC sections ordered by weakness", () => {
    const priorities: PriorityRow[] = [
      {
        questionTypeId: "qt-low",
        name: "Easy type",
        sectionType: "LR",
        attemptCount: 10,
        correctCount: 9,
        accuracyPct: 90,
        goalAccuracy: 86,
        gap: -4,
        priorityTier: "low",
        priorityLevel: "low",
        priorityScore: -16,
        extraCorrectNeededPerTest: 0,
        unlocked: true,
        difficulty: 2,
        averagePerTest: 4,
        reviewCount: 4,
      },
      {
        questionTypeId: "qt-high",
        name: "Flaw",
        sectionType: "LR",
        attemptCount: 10,
        correctCount: 5,
        accuracyPct: 50,
        goalAccuracy: 86,
        gap: 36,
        priorityTier: "highest",
        priorityLevel: "high",
        priorityScore: 324,
        extraCorrectNeededPerTest: 3.2,
        unlocked: true,
        difficulty: 3,
        averagePerTest: 9,
        reviewCount: 10,
      },
    ]
    const sections = mapPrioritiesToSections(priorities)
    expect(sections).toHaveLength(1)
    expect(sections[0]?.id).toBe("LR")
    expect(sections[0]?.rows.map((r) => r.id)).toEqual(["qt-high", "qt-low"])
  })

  it("maps drill and section sessions into history entries", () => {
    const drill = mapDrillSessionToHistoryEntry({
      id: "d1",
      kind: "DRILL",
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-02T00:00:00Z",
      rawScore: 3,
      scaledScore: null,
      percentile: null,
      bookmarked: true,
      excluded: false,
      metadata: { questionTypeName: "Flaw", questionIds: ["a", "b", "c", "d", "e"] },
      prepTestTitle: null,
      sectionTitle: null,
      sectionType: "LR",
    })
    expect(drill).toMatchObject({
      id: "d1",
      testLabel: "Flaw Drill",
      score: 3,
      scoreMax: 5,
      bookmarked: true,
      sectionType: "LR",
    })

    const titled = mapDrillSessionToHistoryEntry({
      id: "d2",
      kind: "DRILL",
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-02T00:00:00Z",
      rawScore: 1,
      scaledScore: null,
      percentile: null,
      bookmarked: false,
      excluded: false,
      metadata: { title: "Main Conclusion", questionIds: ["a"] },
      prepTestTitle: null,
      sectionTitle: null,
      sectionType: null,
    })
    expect(titled?.testLabel).toBe("Main Conclusion Drill")

    const multi = mapDrillSessionToHistoryEntry({
      id: "d2b",
      kind: "DRILL",
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-02T00:00:00Z",
      rawScore: 2,
      scaledScore: null,
      percentile: null,
      bookmarked: false,
      excluded: false,
      metadata: {
        title: "Varied Mix",
        tagLabels: ["Flaw", "Assumption"],
        questionIds: ["a", "b"],
      },
      prepTestTitle: null,
      sectionTitle: null,
      sectionType: "LR",
    })
    expect(multi?.testLabel).toBe("Flaw, Assumption Drill")

    const mixed = mapDrillSessionToHistoryEntry({
      id: "d3",
      kind: "DRILL",
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-02T00:00:00Z",
      rawScore: 0,
      scaledScore: null,
      percentile: null,
      bookmarked: false,
      excluded: false,
      metadata: { sectionType: "LR", questionIds: ["a", "b"] },
      prepTestTitle: null,
      sectionTitle: null,
      sectionType: null,
    })
    expect(mixed?.testLabel).toBe("Varied Mix")
    expect(mixed?.sectionType).toBe("LR")

    const section = mapSectionSessionToHistoryEntry({
      id: "sec1",
      kind: "SECTION",
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-03T00:00:00Z",
      rawScore: 18,
      scaledScore: null,
      percentile: null,
      bookmarked: false,
      excluded: false,
      metadata: { questionCount: 25 },
      prepTestTitle: null,
      sectionTitle: "LR Section 2",
      sectionType: "LR",
    })
    expect(section).toMatchObject({
      id: "sec1",
      testLabel: "LR Section 2",
      score: 18,
      scoreMax: 25,
      sectionType: "LR",
    })

    const lsacId = mapSectionSessionToHistoryEntry({
      id: "sec2",
      kind: "SECTION",
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-03T00:00:00Z",
      rawScore: 1,
      scaledScore: null,
      percentile: null,
      bookmarked: false,
      excluded: false,
      metadata: {},
      prepTestTitle: null,
      sectionTitle: "LR135A-1",
      sectionType: "LR",
    })
    expect(lsacId?.testLabel).toBe("PT135.S1")
  })

  it("formats LSAC section ids as PT#.S#", () => {
    expect(formatSectionHistoryLabel({ sectionTitle: "LR135A-1" })).toBe("PT135.S1")
    expect(formatSectionHistoryLabel({ sectionTitle: "LR155B-4" })).toBe("PT155.S4")
    expect(formatSectionHistoryLabel({ sectionTitle: "RC155A-3" })).toBe("PT155.S3")
    expect(formatSectionHistoryLabel({ sectionTitle: "LR155V-1" })).toBe("PT155.S1")
    expect(
      formatSectionHistoryLabel({
        metadata: { moduleId: "LSAC128", sectionNumber: 3 },
      }),
    ).toBe("PT128.S3")
    expect(formatSectionHistoryLabel({ sectionTitle: "LR Section 2" })).toBe("LR Section 2")
  })

  it("maps drill records with section from metadata when joined sectionType is null", () => {
    const record = mapSessionToDrillRecord({
      id: "d-meta",
      kind: "DRILL",
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-02T00:00:00Z",
      rawScore: 4,
      scaledScore: 155,
      percentile: null,
      bookmarked: false,
      excluded: false,
      metadata: { sectionType: "RC", questionIds: ["a", "b", "c", "d", "e"] },
      prepTestTitle: null,
      sectionTitle: null,
      sectionType: null,
    })
    expect(record).toMatchObject({
      id: "d-meta",
      section: "RC",
      questionsCorrect: 4,
      questionsTotal: 5,
    })
  })
})
