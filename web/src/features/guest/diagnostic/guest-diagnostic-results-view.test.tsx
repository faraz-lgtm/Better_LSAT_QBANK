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
  it("unlocks all 25 section rows for free students", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Full Section Diagnostic · Q25/)).toBeInTheDocument()
    expect(screen.getAllByText(/Target time:/)).toHaveLength(25)
    const last = screen.getByText(/Full Section Diagnostic · Q25/)
    expect(last.closest("[class*='blur']")).toBeNull()
  })

  it("keeps all section rows unlocked for premium students", () => {
    subscription.hasActiveCore = true
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    const row = screen.getByText(/Full Section Diagnostic · Q11/)
    expect(row.closest("[class*='blur']")).toBeNull()
    expect(screen.getAllByText(/Target time:/).length).toBe(25)
  })
})

describe("GuestDiagnosticResultsView Mini teaser", () => {
  it("unlocks the first 5 Mini rows and blurs question 6 for free students", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("mini")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Mini Diagnostic · Q5/)).toBeInTheDocument()
    expect(screen.getAllByText(/Target time:/)).toHaveLength(5)
    expect(screen.getAllByText(/Your time:/)).toHaveLength(5)
    expect(screen.getAllByText(/Answer popularity/i)).toHaveLength(5)
    const locked = screen.getByText(/Mini Diagnostic · Q6/)
    expect(locked.closest("[class*='blur']")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Upgrade to unlock full access" })).toBeInTheDocument()
  })
})
