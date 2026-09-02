import { describe, expect, it } from "vitest"

import {
  customPercentFromTiming,
  customTimeFromTiming,
  drillTimingTitleLabel,
  drillTimingTriggerLabel,
  estimatedDrillBudgetMinutes,
  formatDrillMmSs,
  isValidDrillTiming,
  resolveDrillTimingSeconds,
  speedDrillSeconds,
  standardDrillSeconds,
  targetDrillSeconds,
} from "@/features/student/drills/drill-timing"

describe("drill timing", () => {
  it("uses LSAT pace of 1:24 per question for Standard", () => {
    expect(standardDrillSeconds(5)).toBe(420)
    expect(formatDrillMmSs(420)).toBe("07:00")
    expect(targetDrillSeconds(5)).toBe(442)
    expect(formatDrillMmSs(442)).toBe("07:22")
  })

  it("scales speed-training percents off Standard", () => {
    expect(speedDrillSeconds(5, 70)).toBe(294)
    expect(formatDrillMmSs(294)).toBe("04:54")
    expect(speedDrillSeconds(5, 97)).toBe(407)
    expect(speedDrillSeconds(5, 94)).toBe(395)
  })

  it("accepts preset, speed, percent, and custom time values", () => {
    expect(isValidDrillTiming("unlimited")).toBe(true)
    expect(isValidDrillTiming("pace")).toBe(true)
    expect(isValidDrillTiming("target")).toBe(true)
    expect(isValidDrillTiming("35")).toBe(true)
    expect(isValidDrillTiming("per-q")).toBe(true)
    expect(isValidDrillTiming("speed:97")).toBe(true)
    expect(isValidDrillTiming("pct:100")).toBe(true)
    expect(isValidDrillTiming("time:420")).toBe(true)
    expect(isValidDrillTiming("nope")).toBe(false)
    expect(isValidDrillTiming("speed:50")).toBe(false)
  })

  it("resolves countdown seconds for each mode", () => {
    expect(resolveDrillTimingSeconds("unlimited", 5)).toBe(0)
    expect(resolveDrillTimingSeconds("pace", 5)).toBe(420)
    expect(resolveDrillTimingSeconds("target", 5)).toBe(442)
    expect(resolveDrillTimingSeconds("35", 5)).toBe(35 * 60)
    expect(resolveDrillTimingSeconds("per-q", 5)).toBe(80)
    expect(resolveDrillTimingSeconds("speed:70", 5)).toBe(294)
    expect(resolveDrillTimingSeconds("pct:100", 5)).toBe(420)
    expect(resolveDrillTimingSeconds("time:390", 5)).toBe(390)
    expect(resolveDrillTimingSeconds("35", 5, 1.5)).toBe(Math.round(35 * 60 * 1.5))
  })

  it("labels the closed dropdown from the selected mode", () => {
    expect(drillTimingTriggerLabel("unlimited", 5)).toBe("Unlimited")
    expect(drillTimingTriggerLabel("pace", 5)).toBe("Standard")
    expect(drillTimingTriggerLabel("35", 5, 1.5)).toBe("53 minutes")
    expect(drillTimingTriggerLabel("per-q", 5, 1.5)).toBe("Per question (2:00)")
    expect(drillTimingTriggerLabel("speed:94", 5)).toBe("94%")
  })

  it("keeps custom steppers in sync with the selected preset", () => {
    expect(customPercentFromTiming("pace", 5)).toBe(100)
    expect(customTimeFromTiming("pace", 5)).toBe(420)
    expect(customPercentFromTiming("pct:110", 5)).toBe(110)
    expect(customTimeFromTiming("time:390", 5)).toBe(390)
  })

  it("titles results and estimates whole-drill minutes", () => {
    expect(drillTimingTitleLabel("unlimited")).toBe("Unlimited Time")
    expect(drillTimingTitleLabel("pace")).toBe("Standard")
    expect(estimatedDrillBudgetMinutes("per-q", 5)).toBe(7)
    expect(estimatedDrillBudgetMinutes("pace", 5)).toBe(7)
    expect(estimatedDrillBudgetMinutes("35", 10)).toBe(35)
  })
})
