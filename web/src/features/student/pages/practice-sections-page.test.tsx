import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PracticeSectionsPage } from "@/features/student/pages/practice-sections-page"

const openLockedContentModal = vi.fn()
const getSessions = vi.fn()

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
    getSessions,
  }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/features/student/components/practice-section-start-card", () => ({
  PracticeSectionStartCard: ({ sectionType }: { sectionType: "LR" | "RC" }) => (
    <div data-testid={`paid-section-card-${sectionType}`}>{sectionType} paid card</div>
  ),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <PracticeSectionsPage />
    </MemoryRouter>,
  )
}

describe("PracticeSectionsPage free plan", () => {
  beforeEach(() => {
    openLockedContentModal.mockReset()
    getSessions.mockReset()
    entitlementMock.entitlement.accessState = "PAYMENT_REQUIRED"
    entitlementMock.entitlement.hasActiveCore = false
    entitlementMock.isPaymentRequired = true
  })

  it("renders the locked free preview and opens upgrade modal from gated actions", async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole("heading", { name: "Logical Reasoning" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Reading Comprehension" })).toBeInTheDocument()
    expect(screen.getByText("16-20 Questions")).toBeInTheDocument()
    expect(screen.getByText("4 Passages")).toBeInTheDocument()
    expect(screen.getAllByText("Timing").length).toBe(2)
    expect(screen.getAllByText("Control your Prep pace").length).toBe(2)
    expect(document.querySelectorAll("[data-sections-locked-status]").length).toBe(2)
    expect(getSessions).not.toHaveBeenCalled()
    expect(screen.queryByTestId("paid-section-card-LR")).not.toBeInTheDocument()
    expect(screen.queryByText(/No sections in progress/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Start LR Section" }))
    expect(openLockedContentModal).toHaveBeenCalledWith("sections")

    openLockedContentModal.mockClear()
    await user.click(screen.getByRole("button", { name: "Sections Insight" }))
    expect(openLockedContentModal).toHaveBeenCalledWith("sections")

    openLockedContentModal.mockClear()
    await user.click(screen.getAllByRole("button", { name: "Locked — unlock sections" })[0]!)
    expect(openLockedContentModal).toHaveBeenCalledWith("sections")
  })

  it("filters preview cards by section pills", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole("button", { name: "Logical Reasoning" }))
    expect(screen.getByRole("heading", { name: "Logical Reasoning" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Reading Comprehension" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Start LR Section" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Start RC Section" })).not.toBeInTheDocument()
  })
})

describe("PracticeSectionsPage paid plan", () => {
  beforeEach(() => {
    openLockedContentModal.mockReset()
    getSessions.mockReset()
    getSessions.mockResolvedValue({ sessions: [] })
    entitlementMock.entitlement.accessState = "READY"
    entitlementMock.entitlement.hasActiveCore = true
    entitlementMock.isPaymentRequired = false
  })

  it("loads section sessions and does not show free lock badges", async () => {
    renderPage()

    expect(await screen.findByTestId("paid-section-card-LR")).toBeInTheDocument()
    expect(screen.getByTestId("paid-section-card-RC")).toBeInTheDocument()
    expect(getSessions).toHaveBeenCalledWith({ kind: "SECTION", limit: 50 })
    expect(document.querySelector("[data-sections-locked-status]")).toBeNull()
  })
})
