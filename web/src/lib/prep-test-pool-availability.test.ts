import { describe, expect, it } from "vitest"

import { prepTestFullTestUnavailableLabel } from "@/lib/prep-test-pool-availability"

describe("prepTestFullTestUnavailableLabel", () => {
  it("returns null when tests pool is enabled", () => {
    expect(
      prepTestFullTestUnavailableLabel({ inDrills: false, inSections: false, inTests: true }),
    ).toBeNull()
  })

  it("describes sections-only availability", () => {
    expect(
      prepTestFullTestUnavailableLabel({ inDrills: false, inSections: true, inTests: false }),
    ).toBe("Available only for sections")
  })

  it("describes drills-only availability", () => {
    expect(
      prepTestFullTestUnavailableLabel({ inDrills: true, inSections: false, inTests: false }),
    ).toBe("Available only for drills")
  })

  it("describes drills and sections", () => {
    expect(
      prepTestFullTestUnavailableLabel({ inDrills: true, inSections: true, inTests: false }),
    ).toBe("Available only for drills and sections")
  })

  it("describes fully excluded PrepTests", () => {
    expect(
      prepTestFullTestUnavailableLabel({ inDrills: false, inSections: false, inTests: false }),
    ).toBe("Not available for full PrepTests")
  })
})
