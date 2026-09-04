import { describe, expect, it } from "vitest"

import {
  formatYourTimeAgainstTarget,
  targetTimeHoverLabel,
  targetTimeSecondsForDifficulty,
} from "@/features/student/practice-session/practice-results-ui"

describe("targetTimeHoverLabel", () => {
  it("maps difficulty levels to accommodated target labels", () => {
    expect(targetTimeHoverLabel(1)).toBe("Target time: 01:15")
    expect(targetTimeHoverLabel(3)).toBe("Target time: 01:30")
    expect(targetTimeHoverLabel(5)).toBe("Target time: 01:45")
  })

  it("scales with accommodations", () => {
    expect(targetTimeHoverLabel(3, 1.5)).toBe("Target time: 02:15")
  })

  it("returns null when difficulty is missing", () => {
    expect(targetTimeHoverLabel(null)).toBeNull()
    expect(targetTimeHoverLabel(undefined)).toBeNull()
  })
})

describe("formatYourTimeAgainstTarget", () => {
  it("formats under / over notes against target", () => {
    const target = targetTimeSecondsForDifficulty("Medium")
    expect(formatYourTimeAgainstTarget(target, 60)).toEqual({
      yourTime: "1:00",
      yourTimeNote: "(0:30 under)",
    })
    expect(formatYourTimeAgainstTarget(target, 120)).toEqual({
      yourTime: "2:00",
      yourTimeNote: "(0:30 over)",
    })
  })

  it("shows em dash when your time is unknown", () => {
    expect(formatYourTimeAgainstTarget(90, null)).toEqual({
      yourTime: "—",
      yourTimeNote: "",
    })
  })
})
