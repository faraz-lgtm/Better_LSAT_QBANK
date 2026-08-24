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

describe("GuestDiagnosticResultsView Full teaser", () => {
  it("unlocks the first 10 Full rows and blurs question 11 for free students", () => {
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Full Diagnostic · Q10/)).toBeInTheDocument()
    expect(screen.getAllByText(/Target time:/)).toHaveLength(10)
    const locked = screen.getByText(/Full Diagnostic · Q11/)
    expect(locked.closest("[class*='blur']")).toBeTruthy()
  })

  it("unlocks question 11 for premium students", () => {
    subscription.hasActiveCore = true
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    const row = screen.getByText(/Full Diagnostic · Q11/)
    expect(row.closest("[class*='blur']")).toBeNull()
    expect(screen.getAllByText(/Target time:/).length).toBeGreaterThan(10)
  })
})
