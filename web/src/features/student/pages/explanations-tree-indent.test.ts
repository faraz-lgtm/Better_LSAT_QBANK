import { describe, expect, it } from "vitest"

import {
  EXPLANATION_TREE_LEVELS,
  EXPLANATION_TREE_PL_CLASS,
} from "@/features/student/pages/explanations-tree-indent"

describe("EXPLANATION_TREE_PL_CLASS", () => {
  it("indents each child level further than its parent", () => {
    const px = (level: (typeof EXPLANATION_TREE_LEVELS)[number]) => {
      const cls = EXPLANATION_TREE_PL_CLASS[level]
      const named = cls.match(/^pl-(\d+)$/)
      if (named) return Number(named[1]) * 4
      const arbitrary = cls.match(/^pl-\[(\d+)px\]$/)
      if (arbitrary) return Number(arbitrary[1])
      throw new Error(`Unexpected indent class: ${cls}`)
    }

    const steps = EXPLANATION_TREE_LEVELS.map(px)
    expect(steps).toEqual([24, 56, 88, 120])
    for (let i = 1; i < steps.length; i += 1) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1]!)
    }
  })
})
