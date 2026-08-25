import { describe, expect, it } from "vitest"

import { filterPrepTestTreeToQuestionIds } from "@/features/student/explanation-detail/filter-explanation-tree"
import type { ExplanationPrepTestNode } from "@/features/student/explanation-detail/explanation-tree-types"

const tree: ExplanationPrepTestNode = {
  id: "pt1",
  prepTestNumber: "157",
  rowSubtitle: "",
  sections: [
    {
      id: "sec1",
      sectionNumber: 1,
      kind: "RC",
      sectionTitle: "RC",
      passages: [
        {
          id: "p1",
          label: "P1",
          title: "Passage 1",
          snippet: "",
          questions: [
            {
              id: "q1",
              number: 1,
              code: "PT157.S1.P1.Q1",
              snippet: "",
              topicName: "Main Point",
              status: "fresh",
              source: "",
              difficulty: 3,
            },
            {
              id: "q2",
              number: 2,
              code: "PT157.S1.P1.Q2",
              snippet: "",
              topicName: "Inference",
              status: "fresh",
              source: "",
              difficulty: 2,
            },
          ],
        },
      ],
    },
  ],
}

describe("filterPrepTestTreeToQuestionIds", () => {
  it("keeps only bookmarked questions and drops empty passages", () => {
    const out = filterPrepTestTreeToQuestionIds(tree, new Set(["q2"]))
    expect(out?.sections[0]?.passages[0]?.questions.map((q) => q.id)).toEqual(["q2"])
  })

  it("returns null when no bookmarked questions are in the tree", () => {
    expect(filterPrepTestTreeToQuestionIds(tree, new Set(["other"]))).toBeNull()
  })
})
