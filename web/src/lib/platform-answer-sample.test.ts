import { describe, expect, it } from "vitest"

import {
  MIN_PLATFORM_ANSWER_SAMPLE,
  hasEnoughPlatformAnswerSample,
  platformAnswerSampleSize,
} from "@/lib/platform-answer-sample"

describe("platform-answer-sample", () => {
  it("requires 5 unique answers", () => {
    expect(MIN_PLATFORM_ANSWER_SAMPLE).toBe(5)
    expect(hasEnoughPlatformAnswerSample(0)).toBe(false)
    expect(hasEnoughPlatformAnswerSample(4)).toBe(false)
    expect(hasEnoughPlatformAnswerSample(5)).toBe(true)
  })

  it("sums row counts", () => {
    expect(platformAnswerSampleSize([])).toBe(0)
    expect(platformAnswerSampleSize([{ count: 3 }, { count: 2 }])).toBe(5)
  })
})
