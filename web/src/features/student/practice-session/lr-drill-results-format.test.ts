import { describe, expect, it } from "vitest"

import {
  formatAccuracyPct,
  formatCorrectSummaryLine,
  formatDrillAboutTiming,
  formatLrDrillQuestionTitle,
  formatLrDrillResultsTitle,
  formatRcDrillResultsTitle,
  formatSectionResultsTitle,
  formatPaddedMmSs,
  formatTakeLabel,
  formatTotalQuestionsLabel,
} from "@/features/student/practice-session/lr-drill-results-format"

describe("lr-drill-results-format", () => {
  it("formats question titles with Figma spacing around dots", () => {
    expect(
      formatLrDrillQuestionTitle({
        prepTestNumber: "129",
        sectionNumber: 1,
        questionNumber: 19,
      }),
    ).toBe("PT 129  .  S1  .  Q19")
  })

  it("builds the Figma hero title", () => {
    expect(
      formatLrDrillResultsTitle({ questionCount: 5, timing: "unlimited", take: 3 }),
    ).toBe("5 Questions Unlimited Time - 3")
  })

  it("builds the Figma RC hero title", () => {
    expect(
      formatRcDrillResultsTitle({ passageCount: 1, timing: "unlimited", take: 1 }),
    ).toBe("1 Passages Unlimited Time - 1")
  })

  it("builds the Figma RC section hero title", () => {
    expect(
      formatSectionResultsTitle({
        prepTestNumber: "128",
        sectionNumber: 4,
      }),
    ).toBe("PT128.S4")
  })

  it("pads total questions to two digits", () => {
    expect(formatTotalQuestionsLabel(5)).toBe("Total Questions: 05")
  })

  it("formats score lines from raw counts", () => {
    expect(formatAccuracyPct(1, 5)).toBe("20%")
    expect(formatCorrectSummaryLine(1, 5)).toBe("1/5 CORRECT (-4)")
    expect(formatCorrectSummaryLine(5, 5)).toBe("5/5 CORRECT (0)")
  })

  it("pads mm:ss the way the Figma timing column does", () => {
    expect(formatPaddedMmSs(4)).toBe("00:04")
    expect(formatPaddedMmSs(105)).toBe("01:45")
  })

  it("labels the first take as First", () => {
    expect(formatTakeLabel(1)).toBe("First")
    expect(formatTakeLabel(3)).toBe("Third")
  })

  it("scales About timing for accommodations", () => {
    expect(formatDrillAboutTiming("35", 0)).toBe("35 min")
    expect(formatDrillAboutTiming("35", 0, 1.5)).toBe("53 min")
    expect(formatDrillAboutTiming("standard", 0, 2)).toBe("70 min")
  })
})
