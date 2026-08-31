import { describe, expect, it } from "vitest"

import {
  analyticsSectionParamValue,
  matchesAnalyticsSectionFilter,
  parseAnalyticsSectionParam,
} from "@/features/student/analytics/section-filter"
import { filterDrillsBySection, mockDrillRecords } from "@/features/student/lib/mock-analytics-drills"

describe("section-filter", () => {
  it("parses section query params", () => {
    expect(parseAnalyticsSectionParam(null)).toBe("all")
    expect(parseAnalyticsSectionParam("lr")).toBe("LR")
    expect(parseAnalyticsSectionParam("RC")).toBe("RC")
    expect(parseAnalyticsSectionParam("lg")).toBe("all")
  })

  it("serializes section filters for the URL", () => {
    expect(analyticsSectionParamValue("all")).toBeNull()
    expect(analyticsSectionParamValue("LR")).toBe("lr")
    expect(analyticsSectionParamValue("RC")).toBe("rc")
  })

  it("matches history rows against the active filter", () => {
    expect(matchesAnalyticsSectionFilter("LR", "all")).toBe(true)
    expect(matchesAnalyticsSectionFilter("LR", "LR")).toBe(true)
    expect(matchesAnalyticsSectionFilter("RC", "LR")).toBe(false)
    expect(matchesAnalyticsSectionFilter(null, "RC")).toBe(false)
  })
})

describe("filterDrillsBySection", () => {
  it("keeps only drills for the selected section", () => {
    const lr = filterDrillsBySection(mockDrillRecords, "LR")
    const rc = filterDrillsBySection(mockDrillRecords, "RC")
    expect(lr.every((r) => r.section === "LR")).toBe(true)
    expect(rc.every((r) => r.section === "RC")).toBe(true)
    expect(lr.length + rc.length).toBe(mockDrillRecords.length)
  })
})
