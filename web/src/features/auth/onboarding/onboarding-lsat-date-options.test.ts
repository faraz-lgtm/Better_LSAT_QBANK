import { describe, expect, it } from "vitest"
import {
  buildOnboardingLsatDateOptions,
  getRecommendedLsatDate,
} from "@/features/auth/onboarding/onboarding-lsat-date-options"

describe("getRecommendedLsatDate", () => {
  it("recommends the admin date 6 months from now when it exists", () => {
    // Jul 2026 → Jan 2027
    expect(getRecommendedLsatDate(new Date(2026, 6, 15))).toBe("2027-01-13")
    // Aug 2026 → Feb 2027
    expect(getRecommendedLsatDate(new Date(2026, 7, 24))).toBe("2027-02-12")
  })

  it("falls back to the closest admin month when exact month is missing", () => {
    // Mar 2026 → Sep 2026 (exact)
    expect(getRecommendedLsatDate(new Date(2026, 2, 1))).toBe("2026-09-09")
    // Dec 2026 → Jun 2027
    expect(getRecommendedLsatDate(new Date(2026, 11, 1))).toBe("2027-06-09")
  })
})

describe("buildOnboardingLsatDateOptions", () => {
  it("puts the recommended option first with a Recommended label", () => {
    const options = buildOnboardingLsatDateOptions(new Date(2026, 6, 15))

    expect(options[0]).toEqual({
      label: "January 2027: Test dates Jan 13–16, 2027 (Recommended)",
      value: "2027-01-13",
    })
    expect(options.some((o) => o.value === "not_sure")).toBe(false)
    expect(options.filter((o) => o.label.includes("Recommended"))).toHaveLength(1)
  })

  it("includes official LSAC registration windows with date ranges", () => {
    const options = buildOnboardingLsatDateOptions(new Date(2026, 6, 15))
    const labels = options.map((o) => o.label)

    expect(labels.some((l) => l.includes("Sep 9–12, 2026"))).toBe(true)
    expect(labels.some((l) => l.includes("Oct 7–10, 2026"))).toBe(true)
    expect(labels.some((l) => l.includes("Nov 11–14, 2026"))).toBe(true)
    expect(labels.some((l) => l.includes("Jan 13–16, 2027"))).toBe(true)
    expect(labels.some((l) => l.includes("Feb 12–13, 2027"))).toBe(true)
    expect(labels.some((l) => l.includes("Apr 8–10, 2027"))).toBe(true)
    expect(labels.some((l) => l.includes("Jun 9–12, 2027"))).toBe(true)
  })
})
