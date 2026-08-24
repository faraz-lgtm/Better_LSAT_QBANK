import { describe, expect, it } from "vitest"

import {
  diagnosticAttemptHref,
  diagnosticHistoryHref,
  diagnosticResultsSectionFromIntent,
  diagnosticResultsSectionFromPath,
  isDiagnosticResultsPath,
  isFullDiagnosticIntent,
} from "@/features/student/diagnostic/diagnostic-results-routes"

describe("diagnostic results routes", () => {
  it("maps quick and full intents onto the Full history section", () => {
    expect(isFullDiagnosticIntent("quick")).toBe(true)
    expect(isFullDiagnosticIntent("full")).toBe(true)
    expect(isFullDiagnosticIntent("mini")).toBe(false)
    expect(diagnosticResultsSectionFromIntent("mini")).toBe("mini")
    expect(diagnosticResultsSectionFromIntent("quick")).toBe("full")
  })

  it("builds history and attempt hrefs", () => {
    expect(diagnosticHistoryHref("mini")).toBe("/app/diagnostic/results/mini")
    expect(diagnosticHistoryHref("full")).toBe("/app/diagnostic/results/full")
    expect(diagnosticAttemptHref("mini", "a1")).toBe("/app/diagnostic/results/mini/a1")
    expect(diagnosticAttemptHref("quick", "a2")).toBe("/app/diagnostic/results/full/a2")
  })

  it("reads the active section from the pathname", () => {
    expect(diagnosticResultsSectionFromPath("/app/diagnostic/results/mini")).toBe("mini")
    expect(diagnosticResultsSectionFromPath("/app/diagnostic/results/mini/a1")).toBe("mini")
    expect(diagnosticResultsSectionFromPath("/app/diagnostic/results/full/a2")).toBe("full")
    expect(diagnosticResultsSectionFromPath("/app/diagnostic/results")).toBeNull()
    expect(isDiagnosticResultsPath("/app/diagnostic/results/mini")).toBe(true)
    expect(isDiagnosticResultsPath("/app/practice/drills")).toBe(false)
  })
})
