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
  it("shows unlocked rows then locked teasers under the free analytics limit overlay", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("button", { name: "Show All" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show less" })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Full Section Diagnostic question 10/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Full Section Diagnostic question 6/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument()
    expect(screen.getByTestId("guest-free-analytics-limit-cta")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Full Access" })).toBeInTheDocument()
    expect(screen.getByText("You've reached your free analytics limit!")).toBeInTheDocument()

    const lockedRows = screen.getAllByTestId("diagnostic-locked-question-row")
    expect(lockedRows.length).toBeGreaterThan(0)

    // Real Q11 type must not appear in locked teasers (dummy only).
    const realQ11Type = getDiagnosticQuestionMeta("section-diag-q11", "quick")?.questionType
    expect(realQ11Type).toBeTruthy()
    for (const row of lockedRows) {
      expect(row.textContent).not.toContain(realQ11Type!)
    }
  })

  it("keeps all section rows unlocked for premium students with no limit overlay", () => {
    subscription.hasActiveCore = true
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.queryByTestId("diagnostic-locked-question-row")).toBeNull()
    expect(screen.getByLabelText(/Full Section Diagnostic question 11/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Subscribe" })).not.toBeInTheDocument()
    expect(screen.queryByText("Take your first full exam to track progress")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Unlock my full report" })).not.toBeInTheDocument()
    expect(screen.queryByTestId("guest-free-analytics-limit-cta")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show All" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show less" })).not.toBeInTheDocument()
  })
})

describe("GuestDiagnosticResultsView Mini teaser", () => {
  it("shows first 5 Mini rows open and Q6+ as dummy locked teasers under the limit overlay", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("mini")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/Mini Diagnostic question 5/i)).toBeInTheDocument()
    expect(screen.getAllByTestId("diagnostic-locked-question-row").length).toBe(5)
    expect(screen.getByTestId("guest-free-analytics-limit-cta")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Full Access" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show All" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show less" })).not.toBeInTheDocument()

    const realQ6Type = getDiagnosticQuestionMeta("mini-diag-q6", "mini")?.questionType
    expect(realQ6Type).toBeTruthy()
    for (const row of screen.getAllByTestId("diagnostic-locked-question-row")) {
      expect(row.textContent).not.toContain(realQ6Type!)
    }
  })
})

describe("GuestDiagnosticResultsView Full teaser", () => {
  it("shows first 10 Full Diagnostic rows open and later rows as dummy locked teasers under the limit overlay", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("full")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/Full Diagnostic question 10/i)).toBeInTheDocument()
    expect(screen.getAllByTestId("diagnostic-locked-question-row").length).toBeGreaterThan(0)
    expect(screen.getByTestId("guest-free-analytics-limit-cta")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show less" })).not.toBeInTheDocument()
  })
})
