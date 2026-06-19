import { describe, expect, it } from "vitest"

import { prepTestHeaderLabel } from "@/features/student/preptests/preptest-hub-navigation"

describe("prepTestHeaderLabel", () => {
  it("uses LSAC module id for PT number", () => {
    expect(prepTestHeaderLabel("LSAC101", null)).toBe("PT101")
    expect(prepTestHeaderLabel("LSAC152:form-a", "The Official LSAT PrepTest")).toBe("PT152")
  })

  it("falls back to PT number in title", () => {
    expect(prepTestHeaderLabel(null, "PT 129")).toBe("PT129")
    expect(prepTestHeaderLabel(null, "The Official LSAT PrepTest 152")).toBe("PT152")
  })

  it("returns PrepTest when no number is available", () => {
    expect(prepTestHeaderLabel(null, null)).toBe("PrepTest")
  })
})
