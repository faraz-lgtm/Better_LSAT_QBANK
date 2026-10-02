import { describe, expect, it } from "vitest"

import { explanationListQuestionLabel } from "@/features/student/explanation-detail/explanation-list-question-label"

describe("explanationListQuestionLabel", () => {
  it("uses the RC/LG citation from the tree", () => {
    expect(explanationListQuestionLabel({ code: "PT158.S1.P1.Q1", number: 1 })).toBe("PT158.S1.P1.Q1")
    expect(explanationListQuestionLabel({ code: "PT158.S1.P1.Q2", number: 2 })).toBe("PT158.S1.P1.Q2")
    expect(explanationListQuestionLabel({ code: "PT160.S3.G1.Q12", number: 12 })).toBe("PT160.S3.G1.Q12")
  })

  it("omits the synthetic LR passage segment", () => {
    expect(explanationListQuestionLabel({ code: "PT158.S2.LR.Q1", number: 1 })).toBe("PT158.S2.Q1")
    expect(explanationListQuestionLabel({ code: "PT159.S1.Q1", number: 1 })).toBe("PT159.S1.Q1")
  })

  it("falls back to Qn when code is missing", () => {
    expect(explanationListQuestionLabel({ code: "  ", number: 4 })).toBe("Q4")
    expect(explanationListQuestionLabel({ code: null, number: 7 })).toBe("Q7")
  })
})
