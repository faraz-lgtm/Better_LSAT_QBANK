import { describe, expect, it } from "vitest"

import {
  OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE,
  visibleOverviewSectionDrillCount,
} from "./overview-section-drills"

describe("visibleOverviewSectionDrillCount", () => {
  it("shows all rows when at or under the initial window", () => {
    expect(visibleOverviewSectionDrillCount(2, false)).toBe(2)
    expect(visibleOverviewSectionDrillCount(OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE, false)).toBe(
      OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE,
    )
  })

  it("collapses to the top 3 weakest when there are many drills", () => {
    expect(visibleOverviewSectionDrillCount(4, false)).toBe(3)
    expect(visibleOverviewSectionDrillCount(18, false)).toBe(3)
    expect(OVERVIEW_SECTION_DRILLS_INITIAL_VISIBLE).toBe(3)
  })

  it("shows every drill when expanded", () => {
    expect(visibleOverviewSectionDrillCount(18, true)).toBe(18)
  })
})
