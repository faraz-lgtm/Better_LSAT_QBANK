import { describe, expect, it } from "vitest"

import { buildExplanationQuestionNav } from "@/features/student/explanation-detail/build-explanation-question-nav"
import type { ExplanationPrepTestNode } from "@/features/student/explanation-detail/explanation-tree-types"

function q(id: string, number: number, status: "answered" | "fresh" = "fresh") {
  return {
    id,
    number,
    code: `Q${number}`,
    snippet: "",
    topicName: "",
    status,
    source: "",
    difficulty: 3 as const,
  }
}

describe("buildExplanationQuestionNav", () => {
  it("lists the entire PrepTest with section and passage headings", () => {
    const prepTest: Pick<ExplanationPrepTestNode, "sections"> = {
      sections: [
        {
          id: "s1",
          sectionNumber: 1,
          kind: "RC",
          sectionTitle: "RC",
          passages: [
            {
              id: "p1",
              label: "P1",
              title: "Passage 1",
              snippet: "",
              questions: [q("q1", 1, "answered"), q("q2", 2)],
            },
            {
              id: "p2",
              label: "P2",
              title: "Passage 2",
              snippet: "",
              questions: [q("q8", 8)],
            },
          ],
        },
        {
          id: "s2",
          sectionNumber: 2,
          kind: "LR",
          sectionTitle: "LR",
          passages: [
            {
              id: "lr",
              label: "LR",
              title: "Section questions",
              snippet: "",
              questions: [q("q10", 1), q("q11", 2)],
            },
          ],
        },
      ],
    }

    const nav = buildExplanationQuestionNav(prepTest)

    expect(nav.map((s) => s.heading)).toEqual(["SECTION 1 · RC", "SECTION 2 · LR"])
    expect(nav[0]?.passages.map((p) => p.heading)).toEqual(["PASSAGE 1", "PASSAGE 2"])
    expect(nav[0]?.passages[0]?.questions.map((item) => item.id)).toEqual(["q1", "q2"])
    expect(nav[0]?.passages[1]?.questions.map((item) => item.id)).toEqual(["q8"])
    expect(nav[1]?.passages).toHaveLength(1)
    expect(nav[1]?.passages[0]?.heading).toBeNull()
    expect(nav[1]?.passages[0]?.questions.map((item) => item.number)).toEqual([1, 2])
  })
})
