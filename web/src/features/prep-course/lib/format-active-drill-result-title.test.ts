import { describe, expect, it } from "vitest"

import { formatActiveDrillResultTitle } from "@/features/prep-course/lib/format-active-drill-result-title"

describe("formatActiveDrillResultTitle", () => {
  it("uses Active Drill - {name} without duplicating the prefix", () => {
    expect(formatActiveDrillResultTitle("Active Drill", "Motivational Posters")).toBe(
      "Active Drill - Motivational Posters",
    )
    expect(formatActiveDrillResultTitle("Active Drill", "Active Drill - Motivational Posters")).toBe(
      "Active Drill - Motivational Posters",
    )
    expect(formatActiveDrillResultTitle("Active Drill", "Active Drill: Neurochemical Imbalances")).toBe(
      "Active Drill - Neurochemical Imbalances",
    )
    expect(formatActiveDrillResultTitle("Active Drill", "Active Drill: Sample")).toBe("Active Drill - Sample")
  })
})
