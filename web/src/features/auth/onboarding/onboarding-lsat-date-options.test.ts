import { describe, expect, it } from "vitest"
import {
  buildOnboardingLsatDateOptions,
  getRecommendedLsatDate,
} from "@/features/auth/onboarding/onboarding-lsat-date-options"

describe("getRecommendedLsatDate", () => {
  it("recommends the admin date 6 months from now when it exists", () => {
    // Jul 2026 → Jan 2027
    expect(getRecommendedLsatDate(new Date(2026, 6, 15))).toBe("2027-01-01")
    // Aug 2026 → Feb 2027
    expect(getRecommendedLsatDate(new Date(2026, 7, 24))).toBe("2027-02-01")
  })

  it("falls back to the closest admin month when exact month is missing", () => {
    // Mar 2026 → Sep 2026 (exact)
    expect(getRecommendedLsatDate(new Date(2026, 2, 1))).toBe("2026-09-01")
    // Dec 2026 → Jun 2027 (missing) → closest is Feb 2027
    expect(getRecommendedLsatDate(new Date(2026, 11, 1))).toBe("2027-02-01")
  })
})

describe("buildOnboardingLsatDateOptions", () => {
  it("puts the recommended option first with a Recommended label", () => {
    const options = buildOnboardingLsatDateOptions(new Date(2026, 6, 15))

    expect(options[0]).toEqual({
      label: "January 2027 (Recommended)",
      value: "2027-01-01",
    })
    expect(options.at(-1)).toEqual({
      label: "Not sure yet",
      value: "not_sure",
    })
    expect(options.filter((o) => o.label.includes("Recommended"))).toHaveLength(1)
  })
})
