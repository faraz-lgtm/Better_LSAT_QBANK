import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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

async function expandTotalQuestions() {
  const user = userEvent.setup()
  await user.click(screen.getByRole("button", { name: "Show All" }))
}

describe("GuestDiagnosticResultsView Section diagnostic", () => {
  it("collapses Total Questions to 3 rows, then Show All reveals the rest", async () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("button", { name: "Show All" })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Full Section Diagnostic question 4/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId("diagnostic-locked-question-row")).toBeNull()

    await expandTotalQuestions()

    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument()
    expect(screen.getByLabelText(/Full Section Diagnostic question 10/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Full Section Diagnostic question 6/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument()

    const lockedRows = screen.getAllByTestId("diagnostic-locked-question-row")
    expect(lockedRows.length).toBeGreaterThan(0)

    // Real Q11 type must not appear in locked teasers (dummy only).
    const realQ11Type = getDiagnosticQuestionMeta("section-diag-q11", "quick")?.questionType
    expect(realQ11Type).toBeTruthy()
    for (const row of lockedRows) {
      expect(row.textContent).not.toContain(realQ11Type!)
    }
  })

  it("keeps all section rows unlocked for premium students after expand", async () => {
    subscription.hasActiveCore = true
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    await expandTotalQuestions()

    expect(screen.queryByTestId("diagnostic-locked-question-row")).toBeNull()
    expect(screen.getByLabelText(/Full Section Diagnostic question 11/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Subscribe" })).not.toBeInTheDocument()
    expect(screen.queryByText("Take your first full exam to track progress")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Unlock my full report" })).not.toBeInTheDocument()
  })
})

describe("GuestDiagnosticResultsView Mini teaser", () => {
  it("shows first 5 Mini rows open and Q6+ as dummy locked teasers after Show All", async () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("mini")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("button", { name: "Show All" })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Mini Diagnostic question 5/i)).not.toBeInTheDocument()

    await expandTotalQuestions()

    expect(screen.getByLabelText(/Mini Diagnostic question 5/i)).toBeInTheDocument()
    expect(screen.getAllByTestId("diagnostic-locked-question-row").length).toBe(5)

    const realQ6Type = getDiagnosticQuestionMeta("mini-diag-q6", "mini")?.questionType
    expect(realQ6Type).toBeTruthy()
    for (const row of screen.getAllByTestId("diagnostic-locked-question-row")) {
      expect(row.textContent).not.toContain(realQ6Type!)
    }
  })
})

describe("GuestDiagnosticResultsView Full teaser", () => {
  it("shows first 10 Full Diagnostic rows open and later rows as dummy locked teasers after Show All", async () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("full")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    await expandTotalQuestions()

    expect(screen.getByLabelText(/Full Diagnostic question 10/i)).toBeInTheDocument()
    expect(screen.getAllByTestId("diagnostic-locked-question-row").length).toBeGreaterThan(0)
  })
})
