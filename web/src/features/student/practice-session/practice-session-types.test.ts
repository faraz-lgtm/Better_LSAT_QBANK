import { describe, expect, it } from "vitest"

import {
  isExamChromeLayout,
  isOfficialLayout,
  resolveExamSessionVariant,
} from "@/features/student/practice-session/practice-session-types"

describe("exam chrome variants", () => {
  it("treats LSAT default and official as exam chrome", () => {
    expect(isExamChromeLayout("active-drill")).toBe(true)
    expect(isExamChromeLayout("official")).toBe(true)
    expect(isExamChromeLayout("blind-review")).toBe(false)
    expect(isExamChromeLayout("default")).toBe(false)
  })

  it("resolves official only when the interface toggle is on", () => {
    expect(resolveExamSessionVariant({ blindReview: false, officialInterface: true })).toBe("official")
    expect(resolveExamSessionVariant({ blindReview: false, officialInterface: false })).toBe("active-drill")
    expect(resolveExamSessionVariant({ blindReview: true, officialInterface: true })).toBe("blind-review")
    expect(isOfficialLayout("official")).toBe(true)
    expect(isOfficialLayout("active-drill")).toBe(false)
  })
})
