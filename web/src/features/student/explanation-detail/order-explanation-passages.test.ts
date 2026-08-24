import { describe, expect, it } from "vitest"

import { passagesInQuestionOrder } from "@/features/student/explanation-detail/order-explanation-passages"
import type { ExplanationPassageNode, ExplanationQuestionNode } from "@/features/student/explanation-detail/explanation-tree-types"

function q(number: number, code: string): ExplanationQuestionNode {
  return {
    id: `q${number}`,
    number,
    code,
    snippet: "",
    topicName: "—",
    status: "fresh",
    source: "",
    difficulty: 3,
  }
}

function passage(
  id: string,
  label: string,
  title: string,
  numbers: number[],
): ExplanationPassageNode {
  return {
    id,
    label,
    title,
    snippet: "",
    questions: numbers.map((n) => q(n, `PT157.S1.${label}.Q${n}`)),
  }
}

describe("passagesInQuestionOrder", () => {
  it("orders RC passages by first question number and relabels them", () => {
    const out = passagesInQuestionOrder([
      passage("late", "P1", "Passage 1", [20, 21]),
      passage("early", "P2", "Passage 2", [1, 2, 3, 4, 5, 6]),
      passage("mid", "P3", "Passage 3", [7, 8, 9, 10, 11, 12]),
    ])

    expect(out.map((p) => p.id)).toEqual(["early", "mid", "late"])
    expect(out.map((p) => p.label)).toEqual(["P1", "P2", "P3"])
    expect(out.map((p) => p.title)).toEqual(["Passage 1", "Passage 2", "Passage 3"])
    expect(out.map((p) => p.questions[0]?.number)).toEqual([1, 7, 20])
    expect(out[1]?.questions[0]?.code).toBe("PT157.S1.P2.Q7")
    expect(out[2]?.questions[0]?.code).toBe("PT157.S1.P3.Q20")
  })

  it("leaves LR synthetic passages unchanged", () => {
    const lr = passage("lr", "LR", "Section questions", [1, 2])
    expect(passagesInQuestionOrder([lr])).toEqual([lr])
  })
})
