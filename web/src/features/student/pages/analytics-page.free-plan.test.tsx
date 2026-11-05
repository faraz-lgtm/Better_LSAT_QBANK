import { render, screen } from "@testing-library/react"
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

  it("shows Insights overview empty state without loading analytics bundle", () => {
    renderOverview()

    expect(screen.getByTestId("analytics-insights-free-preview")).toBeInTheDocument()
    expect(screen.getByText("Start practicing to see your data")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Take the Diagnostic Test" })).toBeInTheDocument()
    expect(getPageBundle).not.toHaveBeenCalled()
    expect(openLockedContentModal).not.toHaveBeenCalled()
  })

  it("shows the same Insights empty state for premium LSAC-setup users", () => {
    entitlementMock.entitlement.accessState = "LSAC_REQUIRED"
    entitlementMock.entitlement.hasActiveCore = true
    entitlementMock.isPaymentRequired = false
    entitlementMock.isLsacSetupRequired = true
    entitlementMock.canAccessLsacContent = false

    renderOverview()

    expect(screen.getByTestId("analytics-insights-free-preview")).toBeInTheDocument()
    expect(screen.getByText("Official LSAC licensed prep")).toBeInTheDocument()
    expect(getPageBundle).not.toHaveBeenCalled()
  })
})
