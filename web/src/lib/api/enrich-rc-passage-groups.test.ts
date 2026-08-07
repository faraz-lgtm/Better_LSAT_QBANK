import { describe, expect, it } from "vitest"

import type { DrillQuestion } from "@/features/student/drills/drill-types"
import { passageBreakAfterIndices } from "@/features/student/practice-session/question-nav-passage-breaks"
import {
  applySourceGroupIds,
  shouldEnrichRcQuestions,
} from "@/lib/api/enrich-rc-passage-groups"

function q(
  id: string,
  passageId: string,
  sourceGroupId?: string | null,
  body = "full passage text",
): DrillQuestion {
  return {
    id,
    questionNumber: null,
    stimulusText: null,
    stemText: null,
    choices: [],
    passage: {
      id: passageId,
      displayNumber: 1,
      title: "Original title",
      body,
    },
    sourceGroupId,
  }
}

describe("shouldEnrichRcQuestions", () => {
  it("is false when passage groups already differ", () => {
    expect(shouldEnrichRcQuestions([q("1", "a"), q("2", "b")])).toBe(false)
  })

  it("is true when every question collapsed onto one passage id", () => {
    expect(shouldEnrichRcQuestions([q("1", "same"), q("2", "same"), q("3", "same")])).toBe(true)
  })
})

describe("applySourceGroupIds", () => {
  it("adds sourceGroupId for nav breaks without changing passage text", () => {
    const questions = [q("1", "same"), q("2", "same"), q("3", "same"), q("4", "same")]
    const groupByQuestionId = new Map([
      ["1", "g1"],
      ["2", "g1"],
      ["3", "g2"],
      ["4", "g2"],
    ])

    const out = applySourceGroupIds(questions, groupByQuestionId)

    expect(out.map((item) => item.sourceGroupId)).toEqual(["g1", "g1", "g2", "g2"])
    expect(out[0]?.passage?.body).toBe("full passage text")
    expect(out[0]?.passage?.title).toBe("Original title")
    expect(out[2]?.passage?.id).toBe("same")
    expect(passageBreakAfterIndices(out)).toEqual(new Set([1]))
  })
})
