import { describe, expect, it } from "vitest"

import {
  passageBreakAfterIndices,
  passageNavGroupKey,
} from "@/features/student/practice-session/question-nav-passage-breaks"

describe("passageBreakAfterIndices", () => {
  it("returns no breaks when questions have no passages", () => {
    expect(passageBreakAfterIndices([{ id: "a" }, { id: "b" }] as never)).toEqual(new Set())
    expect(
      passageBreakAfterIndices([{ passage: null }, { passage: null }, { passage: null }]),
    ).toEqual(new Set())
  })

  it("inserts breaks between consecutive RC passage groups", () => {
    const questions = [
      { passage: { id: "p1" } },
      { passage: { id: "p1" } },
      { passage: { id: "p1" } },
      { passage: { id: "p2" } },
      { passage: { id: "p2" } },
      { passage: { id: "p3" } },
    ]
    expect(passageBreakAfterIndices(questions)).toEqual(new Set([2, 4]))
  })

  it("prefers sourceGroupId when passage ids collapsed to the same fallback", () => {
    const questions = [
      { passage: { id: "same" }, sourceGroupId: "g1" },
      { passage: { id: "same" }, sourceGroupId: "g1" },
      { passage: { id: "same" }, sourceGroupId: "g2" },
      { passage: { id: "same" }, sourceGroupId: "g2" },
    ]
    expect(passageBreakAfterIndices(questions)).toEqual(new Set([1]))
    expect(passageNavGroupKey(questions[0]!)).toBe("sg:g1")
    expect(passageNavGroupKey(questions[2]!)).toBe("sg:g2")
  })

  it("ignores transitions involving a missing group key", () => {
    expect(
      passageBreakAfterIndices([
        { passage: { id: "p1" } },
        { passage: null },
        { passage: { id: "p2" } },
      ]),
    ).toEqual(new Set())
  })
})
