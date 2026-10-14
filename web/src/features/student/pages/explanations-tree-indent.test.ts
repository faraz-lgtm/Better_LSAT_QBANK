import { describe, expect, it } from "vitest"

import {
  EXPLANATION_TREE_LEVELS,
  EXPLANATION_TREE_PL_CLASS,
} from "@/features/student/pages/explanations-tree-indent"

function paddingPx(cls: string, preferSm = true): number {
  const token = preferSm
    ? cls.match(/(?:^|\s)sm:(pl-\S+)/)?.[1] ?? cls.match(/(?:^|\s)(pl-\S+)/)?.[1]
    : cls.match(/(?:^|\s)(pl-\S+)/)?.[1]
  if (!token) throw new Error(`Unexpected indent class: ${cls}`)

  const named = token.match(/^pl-(\d+)$/)
  if (named) return Number(named[1]) * 4
  const arbitrary = token.match(/^pl-\[(\d+)px\]$/)
  if (arbitrary) return Number(arbitrary[1])
  throw new Error(`Unexpected indent token: ${token}`)
}

describe("EXPLANATION_TREE_PL_CLASS", () => {
  it("indents each child level further than its parent on desktop", () => {
    const steps = EXPLANATION_TREE_LEVELS.map((level) => paddingPx(EXPLANATION_TREE_PL_CLASS[level], true))
    expect(steps).toEqual([24, 56, 88, 120])
    for (let i = 1; i < steps.length; i += 1) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1]!)
    }
  })

  it("keeps shallower mobile indents that still increase by depth", () => {
    const steps = EXPLANATION_TREE_LEVELS.map((level) => paddingPx(EXPLANATION_TREE_PL_CLASS[level], false))
    expect(steps).toEqual([16, 24, 32, 32])
    for (let i = 1; i < steps.length; i += 1) {
      expect(steps[i]).toBeGreaterThanOrEqual(steps[i - 1]!)
    }
  })
})
