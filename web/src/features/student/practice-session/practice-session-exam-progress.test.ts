import { describe, expect, it } from "vitest"

import { parseQuestionProgressLabel, resolveExamProgress } from "@/features/student/practice-session/practice-session-exam-progress"

describe("practice session exam progress", () => {
  it("parses the question progress label", () => {
    expect(parseQuestionProgressLabel("1 of 26")).toEqual({ current: 1, total: 26 })
    expect(parseQuestionProgressLabel("13 of 26")).toEqual({ current: 13, total: 26 })
    expect(parseQuestionProgressLabel("bad")).toBeNull()
  })

  it("uses question position for the header bar, not a timer fraction", () => {
    expect(resolveExamProgress({ current: 1, total: 26 }).ratio).toBeCloseTo(1 / 26)
    expect(resolveExamProgress({ current: 13, total: 26 }).ratio).toBe(0.5)
    expect(resolveExamProgress({ label: "3 of 10" }).ratio).toBe(0.3)
    expect(resolveExamProgress({}).ratio).toBe(0)
  })
})
