import { describe, expect, it } from "vitest"

import {
  formatSectionTimeMinutes,
  sectionIntroDirections,
  sectionIntroTitle,
} from "@/features/student/sections/section-intro-directions"

describe("sectionIntroDirections", () => {
  it("returns LR and RC copy", () => {
    expect(sectionIntroDirections("LR")).toContain("Each question in this section")
    expect(sectionIntroDirections("RC")).toContain("Each passage in this section")
  })

  it("formats section title and time", () => {
    expect(sectionIntroTitle(1, "LR")).toBe("Section 1")
    expect(formatSectionTimeMinutes(35)).toBe("35 minutes")
  })
})
