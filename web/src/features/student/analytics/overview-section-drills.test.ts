import { describe, expect, it } from "vitest"

import { OVERVIEW_SECTION_DRILLS_MAX, topOverviewSectionDrills } from "./overview-section-drills"

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
