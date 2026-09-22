import { describe, expect, it } from "vitest"

import type { PriorityRow } from "@/lib/api/analytics"
import {
  TAG_DRILLS_INITIAL_VISIBLE,
  TAG_DRILLS_PER_SECTION_EXPANDED,
  TAG_DRILLS_PER_SECTION_INITIAL,
  groupPriorityRowsBySection,
  orderPriorityRowsByWeakness,
  priorityMeterFromRow,
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
    priorityTier: null,
    priorityLevel: "medium",
    priorityScore: null,
    extraCorrectNeededPerTest: null,
    unlocked: true,
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

describe("priorityMeterFromRow", () => {
  it("labels the meter as student priority, not type difficulty", () => {
    expect(priorityMeterFromRow({ priorityTier: "highest", priorityLevel: "high" }).label).toBe("Highest")
    expect(priorityMeterFromRow({ priorityTier: "high", priorityLevel: "high" }).label).toBe("High")
    expect(priorityMeterFromRow({ priorityTier: "medium", priorityLevel: "medium" }).label).toBe("Medium")
    expect(priorityMeterFromRow({ priorityTier: "low", priorityLevel: "low" }).label).toBe("Low")
    expect(priorityMeterFromRow({ priorityTier: null, priorityLevel: "high" }).label).toBe("High")
  })

  it("fills more bars for higher student priority", () => {
    expect(priorityMeterFromRow({ priorityTier: "highest", priorityLevel: "high" }).filledBars).toBe(5)
    expect(priorityMeterFromRow({ priorityTier: "high", priorityLevel: "high" }).filledBars).toBe(4)
    expect(priorityMeterFromRow({ priorityTier: "medium", priorityLevel: "medium" }).filledBars).toBe(3)
    expect(priorityMeterFromRow({ priorityTier: "low", priorityLevel: "low" }).filledBars).toBe(2)
  })
})

describe("groupPriorityRowsBySection", () => {
  it("splits ordered tags into LR and RC lists", () => {
    const grouped = groupPriorityRowsBySection([
      row({ questionTypeId: "rc1", name: "Main Point", sectionType: "RC", priorityLevel: "high" }),
      row({ questionTypeId: "lr1", name: "Flaw", sectionType: "LR", priorityLevel: "high" }),
      row({ questionTypeId: "lr2", name: "Necessary Assumption", sectionType: "LR", priorityLevel: "medium" }),
    ])
    expect(grouped.lr.map((r) => r.name)).toEqual(["Flaw", "Necessary Assumption"])
    expect(grouped.rc.map((r) => r.name)).toEqual(["Main Point"])
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

  it("shows every tag when expanded without a max", () => {
    expect(visibleTagDrillCount(24, true)).toBe(24)
  })

  it("collapses each section to a few top-priority types", () => {
    expect(visibleTagDrillCount(12, false, TAG_DRILLS_PER_SECTION_INITIAL)).toBe(TAG_DRILLS_PER_SECTION_INITIAL)
  })

  it("caps expanded by-type lists at the per-section max", () => {
    expect(
      visibleTagDrillCount(24, true, TAG_DRILLS_PER_SECTION_INITIAL, TAG_DRILLS_PER_SECTION_EXPANDED),
    ).toBe(TAG_DRILLS_PER_SECTION_EXPANDED)
    expect(
      visibleTagDrillCount(8, true, TAG_DRILLS_PER_SECTION_INITIAL, TAG_DRILLS_PER_SECTION_EXPANDED),
    ).toBe(8)
  })
})
