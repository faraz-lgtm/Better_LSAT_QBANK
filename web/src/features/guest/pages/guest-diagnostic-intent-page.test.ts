import { describe, expect, it } from "vitest"

import { getStartLabel } from "@/features/guest/pages/guest-diagnostic-intent-page"

describe("getStartLabel", () => {
  it("returns the selected diagnostic CTA label", () => {
    expect(getStartLabel("quick")).toBe("Start Quick Diagnostic")
    expect(getStartLabel("mini")).toBe("Start Mini Diagnostic")
    expect(getStartLabel("full")).toBe("Start Full Diagnostic")
  })
})
