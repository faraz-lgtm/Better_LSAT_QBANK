import { describe, expect, it } from "vitest"

import {
  displayAnswerPopularityRows,
  resolveAnswerPopularityRows,
} from "@/features/student/explanation-detail/answer-popularity-rows"

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

describe("displayAnswerPopularityRows", () => {
  it("keeps real platform rows when sample is large enough", () => {
    const rows = displayAnswerPopularityRows(
      [
        { letter: "A", count: 3, pct: 60, highlight: true },
        { letter: "B", count: 2, pct: 40 },
      ],
      "A",
      "q1",
      5,
    )
    expect(rows.find((r) => r.letter === "A")?.pct).toBe(60)
    expect(rows.find((r) => r.letter === "B")?.pct).toBe(40)
  })

  it("falls back to provisional bars below the sample threshold", () => {
    const rows = displayAnswerPopularityRows(
      [{ letter: "A", count: 2, pct: 100, highlight: true }],
      "A",
      "q-seed",
      2,
    )
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.reduce((sum, r) => sum + r.pct, 0)).toBe(100)
    expect(rows.find((r) => r.letter === "A")?.highlight).toBe(true)
  })
})
