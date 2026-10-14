import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DiagnosticExplanationsPage } from "@/features/student/pages/diagnostic-explanations-page"

const subscription = vi.hoisted(() => ({
  hasActiveCore: false,
  loading: false,
  error: null as string | null,
  refresh: () => {},
}))

const openPricingModal = vi.fn()

vi.mock("@/features/guest/diagnostic/use-diagnostic-subscription", () => ({
  useDiagnosticSubscription: () => subscription,
}))

vi.mock("@/features/guest/pricing/guest-pricing-modal-provider", () => ({
  useGuestPricingModal: () => ({
    openPricingModal,
    openLockedContentModal: vi.fn(),
    closePricingModal: vi.fn(),
  }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/diagnostic", () => ({
  createDiagnosticApi: () => ({
    getMiniDiagnosticExplanations: async () => ({ explanations: [], videoUrls: [] }),
  }),
}))

describe("DiagnosticExplanationsPage free-limit CTA", () => {
  beforeEach(() => {
    subscription.hasActiveCore = false
    subscription.loading = false
    openPricingModal.mockReset()
  })

  it("shows the upgrade overlay over locked Mini questions for free accounts", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <DiagnosticExplanationsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: "Diagnostic Explanations" })).toBeInTheDocument()
    const limitCtas = screen.getAllByTestId("guest-free-analytics-limit-cta")
    expect(limitCtas.length).toBeGreaterThan(0)
    expect(screen.getAllByText("You've reached your free analytics limit!").length).toBeGreaterThan(0)

    await user.click(screen.getAllByRole("button", { name: "Full Access" })[0]!)
    expect(openPricingModal).toHaveBeenCalledTimes(1)
  })

  it("hides the upgrade overlay when the account has active Core", () => {
    subscription.hasActiveCore = true
    render(
      <MemoryRouter>
        <DiagnosticExplanationsPage />
      </MemoryRouter>,
    )

    expect(screen.queryByTestId("guest-free-analytics-limit-cta")).not.toBeInTheDocument()
    expect(screen.queryByText("You've reached your free analytics limit!")).not.toBeInTheDocument()
    expect(screen.queryByText("Locked")).not.toBeInTheDocument()
  })
})
