import { describe, expect, it } from "vitest"

import type { PriorityRow } from "@/lib/api/analytics"
import {
  TAG_DRILLS_INITIAL_VISIBLE,
  orderPriorityRowsByWeakness,
  visibleTagDrillCount,
} from "./tag-drills-priority"

function row(partial: Partial<PriorityRow> & Pick<PriorityRow, "questionTypeId" | "name">): PriorityRow {
  return {
    sectionType: "LR",
    attemptCount: 10,
    correctCount: 5,
    accuracyPct: 50,
    goalAccuracy: 70,
    gap: 20,
    priorityLevel: "medium",
    difficulty: 3,
    averagePerTest: 1,
    reviewCount: 5,
    ...partial,
  }
}

describe("orderPriorityRowsByWeakness", () => {
  it("puts high-priority (weak) tags before medium and low", () => {
    const ordered = orderPriorityRowsByWeakness([
      row({ questionTypeId: "1", name: "Low", priorityLevel: "low", gap: 2 }),
      row({ questionTypeId: "2", name: "High", priorityLevel: "high", gap: 18 }),
      row({ questionTypeId: "3", name: "Medium", priorityLevel: "medium", gap: 10 }),
    ])
    expect(ordered.map((r) => r.name)).toEqual(["High", "Medium", "Low"])
  })

  it("within the same priority level, sorts by larger goal gap first", () => {
    const ordered = orderPriorityRowsByWeakness([
      row({ questionTypeId: "a", name: "Smaller gap", priorityLevel: "high", gap: 16 }),
      row({ questionTypeId: "b", name: "Bigger gap", priorityLevel: "high", gap: 28 }),
    ])
    expect(ordered.map((r) => r.name)).toEqual(["Bigger gap", "Smaller gap"])
  })
})

describe("visibleTagDrillCount", () => {
  it("shows all tags when there are at most the initial window", () => {
    expect(visibleTagDrillCount(5, false)).toBe(5)
    expect(visibleTagDrillCount(TAG_DRILLS_INITIAL_VISIBLE, false)).toBe(TAG_DRILLS_INITIAL_VISIBLE)
  })

  it("collapses to the initial window when there are many tags", () => {
    expect(visibleTagDrillCount(24, false)).toBe(TAG_DRILLS_INITIAL_VISIBLE)
  })

  it("shows every tag when expanded", () => {
    expect(visibleTagDrillCount(24, true)).toBe(24)
  })
})
