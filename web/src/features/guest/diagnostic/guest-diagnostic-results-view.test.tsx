import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { GuestDiagnosticResultsView } from "@/features/guest/diagnostic/guest-diagnostic-results-view"
import { buildDefaultGuestDiagnosticResult } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import { getDiagnosticQuestionMeta } from "@/features/guest/diagnostic/mini-diagnostic-content"

const subscription = vi.hoisted(() => ({
  hasActiveCore: false,
  loading: false,
  error: null as string | null,
  refresh: () => {},
}))

vi.mock("@/features/guest/diagnostic/use-diagnostic-subscription", () => ({
  useDiagnosticSubscription: () => subscription,
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

describe("GuestDiagnosticResultsView Section diagnostic", () => {
  it("shows first 10 open and later rows as dummy teasers (no real gated content)", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getAllByText(/Full Section Diagnostic · Q10/)[0]!.closest("[class*='blur']")).toBeNull()
    expect(screen.getAllByText(/Full Section Diagnostic · Q6/)[0]!.closest("[class*='blur']")).toBeNull()

    const lockedRows = screen.getAllByTestId("diagnostic-locked-question-row")
    expect(lockedRows.length).toBeGreaterThan(0)

    // Real Q11 type must not appear in locked teasers (dummy only).
    const realQ11Type = getDiagnosticQuestionMeta("section-diag-q11", "quick")?.questionType
    expect(realQ11Type).toBeTruthy()
    for (const row of lockedRows) {
      expect(row.textContent).not.toContain(realQ11Type!)
    }
  })

  it("keeps all section rows unlocked for premium students", () => {
    subscription.hasActiveCore = true
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.queryByTestId("diagnostic-locked-question-row")).toBeNull()
    expect(screen.getAllByText(/Q11/)[0]!.closest("[class*='blur']")).toBeNull()
  })
})

describe("GuestDiagnosticResultsView Mini teaser", () => {
  it("shows first 5 Mini rows open and Q6+ as dummy locked teasers", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("mini")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getAllByText(/Mini Diagnostic · Q5/)[0]).toBeInTheDocument()
    expect(screen.getAllByTestId("diagnostic-locked-question-row").length).toBe(5)

    const realQ6Type = getDiagnosticQuestionMeta("mini-diag-q6", "mini")?.questionType
    expect(realQ6Type).toBeTruthy()
    for (const row of screen.getAllByTestId("diagnostic-locked-question-row")) {
      expect(row.textContent).not.toContain(realQ6Type!)
    }
  })
})

describe("GuestDiagnosticResultsView Full teaser", () => {
  it("shows first 10 Full Diagnostic rows open and later rows as dummy locked teasers", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("full")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getAllByText(/Full Diagnostic · Q10/)[0]).toBeInTheDocument()
    expect(screen.getAllByTestId("diagnostic-locked-question-row").length).toBeGreaterThan(0)
  })
})
