import { describe, expect, it } from "vitest"

import { arrowHeadGeometry } from "./draw"

describe("arrowHeadGeometry", () => {
  it("places tip at end", () => {
    const g = arrowHeadGeometry({ x: 0, y: 0 }, { x: 100, y: 0 }, 20)
    expect(g.tip.x).toBe(100)
    expect(g.tip.y).toBe(0)
  })

  it("offsets base along the segment toward start", () => {
    const g = arrowHeadGeometry({ x: 0, y: 0 }, { x: 100, y: 0 }, 20)
    expect(g.left.x).toBeCloseTo(80, 5)
    expect(g.right.x).toBeCloseTo(80, 5)
    expect(Math.abs(g.left.y)).toBeGreaterThan(0)
    expect(g.left.y).toBeCloseTo(-g.right.y, 5)
  })
})
