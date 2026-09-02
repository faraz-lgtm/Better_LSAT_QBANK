import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { GuestPricingModalProvider } from "@/features/guest/pricing/guest-pricing-modal-provider"

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/features/app-shell/student-entitlement-context", () => ({
  useStudentEntitlement: () => ({
    entitlement: {
      isAuthenticated: true,
      isLsacLinked: false,
      isLsacEligible: false,
      hasActiveCore: false,
      accessState: "PAYMENT_REQUIRED",
    },
    loading: false,
    error: null,
    canAccessLsacContent: false,
    isPaymentRequired: true,
    isLsacSetupRequired: false,
    refresh: vi.fn(),
  }),
}))

vi.mock("@/lib/api/users", () => ({
  createUsersApi: () => ({
    getMyProfile: vi.fn().mockResolvedValue({
      first_name: "Assad",
      last_name: "Siyal",
      full_name: "Assad Siyal",
    }),
  }),
}))

vi.mock("@/lib/api/analytics", () => ({
  createAnalyticsApi: () => null,
}))

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => null,
}))

describe("DashboardPage free-plan welcome", () => {
  it("shows the same Figma welcome heading as premium when LSAC content is locked", async () => {
    render(
      <MemoryRouter>
        <GuestPricingModalProvider>
          <DashboardPage />
        </GuestPricingModalProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Welcome back, Assad" })).toBeInTheDocument()
      expect(screen.getByText("Choose a plan to continue")).toBeInTheDocument()
    })
  })
})
