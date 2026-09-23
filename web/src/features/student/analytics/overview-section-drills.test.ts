import { describe, expect, it } from "vitest"

import {
  OVERVIEW_SECTION_DRILLS_MAX,
  averageSectionAccuracyPct,
  formatGapToTargetLabel,
  topOverviewSectionDrills,
} from "./overview-section-drills"

describe("topOverviewSectionDrills", () => {
  it("returns all rows when at or under the max", () => {
    expect(topOverviewSectionDrills(["a", "b"])).toEqual(["a", "b"])
    expect(topOverviewSectionDrills(["a", "b", "c"])).toEqual(["a", "b", "c"])
  })

  it("keeps only the top 3 when there are more drills", () => {
    expect(topOverviewSectionDrills(["a", "b", "c", "d", "e"])).toEqual(["a", "b", "c"])
    expect(OVERVIEW_SECTION_DRILLS_MAX).toBe(3)
  })
})

describe("averageSectionAccuracyPct", () => {
  it("averages finite accuracy values and ignores nulls", () => {
    expect(
      averageSectionAccuracyPct([{ accuracyPct: 50 }, { accuracyPct: null }, { accuracyPct: 70 }]),
    ).toBe(60)
  })

  it("returns null when no accuracy is available", () => {
    expect(averageSectionAccuracyPct([{ accuracyPct: null }])).toBeNull()
    expect(averageSectionAccuracyPct([])).toBeNull()
  })
})

describe("formatGapToTargetLabel", () => {
  it("formats API gap (goal − accuracy) as signed distance to target", () => {
    expect(formatGapToTargetLabel(36)).toBe("-36% to Target")
    expect(formatGapToTargetLabel(-4)).toBe("+4% to Target")
    expect(formatGapToTargetLabel(0)).toBe("On target")
    expect(formatGapToTargetLabel(null)).toBeNull()
  })
})
