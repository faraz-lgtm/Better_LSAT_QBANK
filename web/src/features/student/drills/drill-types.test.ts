import { describe, expect, it } from "vitest"

import { LR_DRILL_MAX_QUESTION_COUNT } from "@/features/student/drills/adaptive-drill-config"
import { drillConfigOptions } from "@/features/student/drills/drill-types"

describe("drillConfigOptions.questionCount", () => {
  it("offers Unlimited plus every count from 1 through 30", () => {
    expect(drillConfigOptions.questionCount.map((option) => option.value)).toEqual([
      "unlimited",
      ...Array.from({ length: LR_DRILL_MAX_QUESTION_COUNT }, (_, index) => String(index + 1)),
    ])
    expect(drillConfigOptions.questionCount[0]).toEqual({ label: "All questions", value: "unlimited" })
  })
})

describe("drillConfigOptions.showAnswers", () => {
  it("offers After the drill and After each question, not Never (blind)", () => {
    expect(drillConfigOptions.showAnswers).toEqual([
      { label: "After the drill", value: "end" },
      { label: "After each question", value: "each" },
    ])
  })
})

describe("drillConfigOptions.passageCount", () => {
  it("keeps RC Passages as Unlimited plus 1–8", () => {
    expect(drillConfigOptions.passageCount.map((option) => option.value)).toEqual([
      "unlimited",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
    ])
    expect(drillConfigOptions.passageCount[0]).toEqual({ label: "Unlimited", value: "unlimited" })
    expect(drillConfigOptions.passageCount[1]).toEqual({ label: "1 passage", value: "1" })
    expect(drillConfigOptions.passageCount[2]).toEqual({ label: "2 passages", value: "2" })
  })
})
