import { describe, expect, it } from "vitest"

import { getStartLabel } from "@/features/guest/pages/guest-diagnostic-intent-page"

describe("getStartLabel", () => {
  it("returns the selected diagnostic CTA label", () => {
    expect(getStartLabel("quick")).toBe("Start Full Section")
    expect(getStartLabel("mini")).toBe("Start Quick Baseline")
    expect(getStartLabel("full")).toBe("Start Full Section")
  })
})
