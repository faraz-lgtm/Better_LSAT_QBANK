import { describe, expect, it } from "vitest"

import type { PracticeSessionSummary } from "@/lib/api/analytics"
import {
  averageSectionMissedDisplay,
  formatSignedMissedAverage,
} from "./section-average-score"

function session(
  partial: Partial<PracticeSessionSummary> &
    Pick<PracticeSessionSummary, "id" | "sectionType" | "rawScore">,
): PracticeSessionSummary {
  return {
    kind: "SECTION",
    startedAt: "2026-01-01T00:00:00Z",
    completedAt: "2026-01-01T01:00:00Z",
    scaledScore: null,
    percentile: null,
    bookmarked: false,
    excluded: false,
    metadata: { questionCount: 25 },
    prepTestTitle: null,
    sectionTitle: "LR 1",
    ...partial,
  }
}

describe("formatSignedMissedAverage", () => {
  it("formats missed questions like PrepTest AVERAGE LR/RC", () => {
    expect(formatSignedMissedAverage(11.4)).toBe("-11")
    expect(formatSignedMissedAverage(0)).toBe("0")
  })
})

describe("averageSectionMissedDisplay", () => {
  it("averages missed questions across completed section sessions", () => {
    const value = averageSectionMissedDisplay(
      [
        session({ id: "1", sectionType: "LR", rawScore: 20, metadata: { questionCount: 25 } }),
        session({ id: "2", sectionType: "LR", rawScore: 22, metadata: { questionCount: 25 } }),
      ],
      "LR",
    )
    // Missed 5 and 3 → average 4
    expect(value).toBe("-4")
  })

  it("returns an em dash when there are no completed sessions", () => {
    expect(averageSectionMissedDisplay([], "RC")).toBe("—")
  })
})
