import { describe, expect, it } from "vitest"

import { hitTest } from "./hit-test"
import type { Annotation } from "./types"

describe("hitTest", () => {
  it("returns top-most annotation", () => {
    const list: Annotation[] = [
      { kind: "rect", id: "a", color: "#000", width: 2, start: { x: 0, y: 0 }, end: { x: 100, y: 100 } },
      { kind: "rect", id: "b", color: "#000", width: 2, start: { x: 0, y: 0 }, end: { x: 100, y: 100 } },
    ]
    expect(hitTest(list, 1, 50)?.id).toBe("b")
  })

  it("hits pen polyline", () => {
    const list: Annotation[] = [
      {
        kind: "pen",
        id: "p",
        color: "#000",
        width: 4,
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
        ],
      },
    ]
    expect(hitTest(list, 25, 1)?.id).toBe("p")
  })

  it("hits text box", () => {
    const list: Annotation[] = [
      {
        kind: "text",
        id: "t",
        position: { x: 10, y: 10 },
        width: 200,
        fontSize: 16,
        color: "#000",
        html: "hi",
      },
    ]
    expect(hitTest(list, 20, 20)?.id).toBe("t")
  })

  it("hits arrow shaft and head", () => {
    const list: Annotation[] = [
      {
        kind: "arrow",
        id: "ar",
        color: "#000",
        width: 2,
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
      },
    ]
    expect(hitTest(list, 50, 0)?.id).toBe("ar")
    expect(hitTest(list, 96, 0)?.id).toBe("ar")
  })
})
