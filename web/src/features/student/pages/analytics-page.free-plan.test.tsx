import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AnalyticsPage } from "@/features/student/pages/analytics-page"

const openLockedContentModal = vi.fn()
const getPageBundle = vi.fn()

const entitlementMock = vi.hoisted(() => ({
  entitlement: {
    accessState: "PAYMENT_REQUIRED" as string | null,
    hasActiveCore: false as boolean | null,
  },
  loading: false,
  canAccessLsacContent: false,
  isPaymentRequired: true,
  isLsacSetupRequired: false,
  error: null,
  refresh: async () => null,
}))

vi.mock("@/features/app-shell/student-entitlement-context", () => ({
  useStudentEntitlementOptional: () => entitlementMock,
}))

vi.mock("@/features/guest/pricing/guest-pricing-modal-provider", () => ({
  useGuestPricingModal: () => ({
    openPricingModal: vi.fn(),
    openLockedContentModal,
    closePricingModal: vi.fn(),
  }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/analytics", () => ({
  createAnalyticsApi: () => ({
    getPageBundle,
  }),
  peekCachedAnalyticsOverview: () => null,
}))

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => null,
}))

vi.mock("@/lib/api/users", () => ({
  createUsersApi: () => ({
    updateStudyPreferences: vi.fn(),
  }),
}))

function renderOverview() {
  return render(
    <MemoryRouter initialEntries={["/app/analytics"]}>
      <Routes>
        <Route path="/app/analytics" element={<AnalyticsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AnalyticsPage free plan", () => {
  beforeEach(() => {
    openLockedContentModal.mockReset()
    getPageBundle.mockReset()
    entitlementMock.entitlement.accessState = "PAYMENT_REQUIRED"
    entitlementMock.entitlement.hasActiveCore = false
    entitlementMock.isPaymentRequired = true
    entitlementMock.isLsacSetupRequired = false
    entitlementMock.canAccessLsacContent = false
  })

  it("shows blurred Insights preview and opens analytics upgrade modal", async () => {
    const user = userEvent.setup()
    renderOverview()

    expect(screen.getByTestId("analytics-insights-free-preview")).toBeInTheDocument()
    expect(screen.getByText("Unlock full analytics")).toBeInTheDocument()
    expect(getPageBundle).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Unlock Analytics" }))
    expect(openLockedContentModal).toHaveBeenCalledWith("analytics")
  })

  it("shows the same Insights preview for premium LSAC-setup users", async () => {
    entitlementMock.entitlement.accessState = "LSAC_REQUIRED"
    entitlementMock.entitlement.hasActiveCore = true
    entitlementMock.isPaymentRequired = false
    entitlementMock.isLsacSetupRequired = true
    entitlementMock.canAccessLsacContent = false

    const user = userEvent.setup()
    renderOverview()

    expect(screen.getByTestId("analytics-insights-free-preview")).toBeInTheDocument()
    expect(getPageBundle).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Unlock Analytics" }))
    expect(openLockedContentModal).toHaveBeenCalledWith("analytics")
  })
})
