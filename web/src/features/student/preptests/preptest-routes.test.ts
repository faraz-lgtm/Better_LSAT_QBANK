import { describe, expect, it } from "vitest"

import {
  PREPTEST_LIST_HREF,
  isPrepTestHubDetailPath,
  isPrepTestStudentPath,
  rewriteLegacyPrepTestPath,
  shouldForceParentNav,
} from "@/features/student/preptests/preptest-routes"

describe("preptest-routes", () => {
  it("detects prep test student paths", () => {
    expect(isPrepTestStudentPath("/app/preptest")).toBe(true)
    expect(isPrepTestStudentPath("/app/preptest/pt-132")).toBe(true)
    expect(isPrepTestStudentPath("/app/practice/preptest")).toBe(false)
  })

  it("detects prep test hub detail paths", () => {
    expect(isPrepTestHubDetailPath("/app/preptest/pt-132")).toBe(true)
    expect(isPrepTestHubDetailPath("/app/preptest/pt-132/section/s1")).toBe(false)
  })

  it("rewrites legacy practice preptest paths", () => {
    expect(rewriteLegacyPrepTestPath("/app/practice/preptest")).toBe("/app/preptest")
    expect(rewriteLegacyPrepTestPath("/app/practice/preptest/pt-132", "?retake=1")).toBe(
      "/app/preptest/pt-132?retake=1",
    )
  })

  it("forces parent navigation from child routes", () => {
    expect(shouldForceParentNav("/app/preptest/pt-132", PREPTEST_LIST_HREF)).toBe(true)
    expect(shouldForceParentNav("/app/preptest", PREPTEST_LIST_HREF)).toBe(false)
  })
})
