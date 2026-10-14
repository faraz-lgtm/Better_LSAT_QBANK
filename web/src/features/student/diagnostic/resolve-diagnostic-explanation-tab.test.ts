import { describe, expect, it } from "vitest"

import { resolveDiagnosticExplanationTab } from "./resolve-diagnostic-explanation-tab"

describe("resolveDiagnosticExplanationTab", () => {
  it("defaults to question", () => {
    expect(resolveDiagnosticExplanationTab(null, false)).toBe("question")
    expect(resolveDiagnosticExplanationTab("explanation", false)).toBe("question")
  })

  it("honors analytics", () => {
    expect(resolveDiagnosticExplanationTab("analytics", false)).toBe("analytics")
  })

  it("honors explanation when the video tab is available", () => {
    expect(resolveDiagnosticExplanationTab("explanation", true)).toBe("explanation")
  })

  it("keeps explanation while availability is still loading (optimistic showExplanationTab)", () => {
    expect(resolveDiagnosticExplanationTab("explanation", true)).toBe("explanation")
  })
})
