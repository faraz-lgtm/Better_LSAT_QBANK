import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PracticeDrillsPage } from "@/features/student/pages/practice-drills-page"

const openLockedContentModal = vi.fn()
const getPageBundle = vi.fn()

const entitlementMock = vi.hoisted(() => ({
  entitlement: {
    accessState: "READY" as string | null,
    hasActiveCore: true as boolean | null,
  },
  loading: false,
  canAccessLsacContent: true,
  isPaymentRequired: false,
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

vi.mock("@/lib/api/analytics", () => ({
  createAnalyticsApi: () => ({
    getPageBundle,
  }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <PracticeDrillsPage />
    </MemoryRouter>,
  )
}

describe("PracticeDrillsPage free plan", () => {
  beforeEach(() => {
    openLockedContentModal.mockReset()
    getPageBundle.mockReset()
    entitlementMock.entitlement.accessState = "PAYMENT_REQUIRED"
    entitlementMock.entitlement.hasActiveCore = false
    entitlementMock.isPaymentRequired = true
  })

  it("renders the locked free preview and opens upgrade modal from gated actions", async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole("heading", { name: "Start A New Drill" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Drills by Types" })).toBeInTheDocument()
    expect(screen.getByText("Ranked by your past performance and score impact")).toBeInTheDocument()
    expect(screen.getByText("Causal reasoning drill")).toBeInTheDocument()
    expect(screen.getByText("Critique or debate drill")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Show All Drills" })).toBeInTheDocument()
    expect(document.querySelectorAll("[data-drills-locked-status]").length).toBe(2)
    expect(getPageBundle).not.toHaveBeenCalled()
    expect(screen.queryByText(/Continue/i)).not.toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Start LR Drill" })[0]!)
    expect(openLockedContentModal).toHaveBeenCalledWith("drills")

    openLockedContentModal.mockClear()
    await user.click(screen.getByRole("button", { name: "Show All Drills" }))
    expect(openLockedContentModal).toHaveBeenCalledWith("drills")

    openLockedContentModal.mockClear()
    await user.click(screen.getAllByRole("button", { name: "Locked — unlock drills" })[0]!)
    expect(openLockedContentModal).toHaveBeenCalledWith("drills")
  })

  it("filters preview rows by section pills", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole("button", { name: "Logical Reasoning" }))
    expect(screen.getByText("Causal reasoning drill")).toBeInTheDocument()
    expect(screen.getByText("Flaw or descriptive weakening drill")).toBeInTheDocument()
    expect(screen.queryByText("Critique or debate drill")).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Start LR Drill" }).length).toBeGreaterThan(0)
    expect(screen.queryByRole("button", { name: "Start RC Drill" })).not.toBeInTheDocument()
  })
})

describe("PracticeDrillsPage paid plan", () => {
  beforeEach(() => {
    openLockedContentModal.mockReset()
    getPageBundle.mockReset()
    getPageBundle.mockResolvedValue({ sessions: { sessions: [] }, priorities: [] })
    entitlementMock.entitlement.accessState = "READY"
    entitlementMock.entitlement.hasActiveCore = true
    entitlementMock.isPaymentRequired = false
  })

  it("loads analytics bundle and does not show free lock badges", async () => {
    renderPage()

    expect(await screen.findByRole("heading", { name: "Start A New Drill" })).toBeInTheDocument()
    expect(getPageBundle).toHaveBeenCalledWith("drills")
    expect(document.querySelector("[data-drills-locked-status]")).toBeNull()
    expect(screen.queryByRole("heading", { name: "Drills by Types" })).not.toBeInTheDocument()
  })
})
