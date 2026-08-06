import { describe, expect, it } from "vitest"

import {
  DEFAULT_SECTION_QUESTION_COUNT,
  buildSectionYAxisLabels,
  resolveSectionChartMax,
  sessionSectionQuestionCount,
} from "./section-progress-axis"

describe("sessionSectionQuestionCount", () => {
  it("prefers metadata.questionCount", () => {
    expect(sessionSectionQuestionCount({ metadata: { questionCount: 26 } }, "LR")).toBe(26)
  })

  it("falls back to questionIds length", () => {
    expect(
      sessionSectionQuestionCount({ metadata: { questionIds: ["a", "b", "c"] } }, "RC"),
    ).toBe(3)
  })

  it("uses section defaults when metadata is empty", () => {
    expect(sessionSectionQuestionCount({ metadata: {} }, "LR")).toBe(DEFAULT_SECTION_QUESTION_COUNT.LR)
    expect(sessionSectionQuestionCount({ metadata: {} }, "RC")).toBe(DEFAULT_SECTION_QUESTION_COUNT.RC)
  })
})

describe("buildSectionYAxisLabels", () => {
  it("builds descending ticks from question count to 0", () => {
    expect(buildSectionYAxisLabels(25)).toEqual([25, 20, 15, 10, 5, 0])
    expect(buildSectionYAxisLabels(27)).toEqual([27, 22, 16, 11, 5, 0])
  })
})

describe("resolveSectionChartMax", () => {
  it("uses the largest observed question count", () => {
    expect(resolveSectionChartMax([25, 26], [18], "LR")).toBe(26)
  })

  it("falls back to section default when nothing is observed", () => {
    expect(resolveSectionChartMax([], [], "RC")).toBe(DEFAULT_SECTION_QUESTION_COUNT.RC)
  })
})
