import { describe, expect, it } from "vitest"

import { resolveAnswerPopularityRows } from "@/features/student/explanation-detail/answer-popularity-rows"

describe("resolveAnswerPopularityRows", () => {
  it("returns A–E zeros when API payload is empty", () => {
    const rows = resolveAnswerPopularityRows([], [], "B")
    expect(rows).toHaveLength(5)
    expect(rows.every((r) => r.count === 0 && r.pct === 0)).toBe(true)
    expect(rows.find((r) => r.letter === "B")?.highlight).toBe(true)
  })

  it("merges API rows with missing letters as zero", () => {
    const rows = resolveAnswerPopularityRows(
      [{ letter: "B", count: 3, pct: 75, highlight: true }],
      [
        { id: "A", index: 1 },
        { id: "B", index: 2 },
      ],
      "B",
    )
    expect(rows).toHaveLength(2)
    expect(rows.find((r) => r.letter === "A")?.count).toBe(0)
    expect(rows.find((r) => r.letter === "B")?.count).toBe(3)
  })
})
