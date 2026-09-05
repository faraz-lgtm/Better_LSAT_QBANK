import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { GuestDiagnosticResultsView } from "@/features/guest/diagnostic/guest-diagnostic-results-view"
import { buildDefaultGuestDiagnosticResult } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"

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
  it("shows first 5 rows plus free analytics gate (no locked question rows)", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getAllByText(/Q5/)[0]).toBeInTheDocument()
    expect(screen.queryByText(/Q6 ·/)).toBeNull()
    expect(
      screen.getByText("You've reached your free analytics limit!"),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Full Access" })).toBeInTheDocument()
  })

  it("keeps all section rows unlocked for premium students", () => {
    subscription.hasActiveCore = true
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    const row = screen.getAllByText(/Q11/)[0]!
    expect(row.closest("[class*='blur']")).toBeNull()
    expect(screen.queryByText("You've reached your free analytics limit!")).toBeNull()
  })
})

describe("GuestDiagnosticResultsView Mini teaser", () => {
  it("shows first 5 Mini rows plus free analytics gate for free students", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("mini")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getAllByText(/Q5/)[0]).toBeInTheDocument()
    expect(screen.queryByText(/Q6 ·/)).toBeNull()
    expect(
      screen.getByText("You've reached your free analytics limit!"),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Full Access" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "See plans from $59/mo" })).toBeInTheDocument()
  })
})

describe("GuestDiagnosticResultsView Full teaser", () => {
  it("shows free analytics gate after first 5 Full Diagnostic rows", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("full")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getAllByText(/Q5/)[0]).toBeInTheDocument()
    expect(screen.queryByText(/Q6 ·/)).toBeNull()
    expect(
      screen.getByText("You've reached your free analytics limit!"),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Full Access" })).toBeInTheDocument()
  })
})
