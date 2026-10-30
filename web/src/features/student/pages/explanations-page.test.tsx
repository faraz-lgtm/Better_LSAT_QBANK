import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ExplanationsPage } from "@/features/student/pages/explanations-page"

const openLockedContentModal = vi.fn()

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

vi.mock("@/lib/api/explanations", () => ({
  createExplanationsApi: () => {
    throw new Error("force mock tree in tests")
  },
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <ExplanationsPage />
    </MemoryRouter>,
  )
}

describe("ExplanationsPage free plan", () => {
  beforeEach(() => {
    openLockedContentModal.mockReset()
    entitlementMock.entitlement.accessState = "PAYMENT_REQUIRED"
    entitlementMock.entitlement.hasActiveCore = false
    entitlementMock.isPaymentRequired = true
    entitlementMock.canAccessLsacContent = false
  })

  it("shows lock badges on PrepTest rows and opens upgrade modal from locked questions", async () => {
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText("LSAT Question Explanations")).toBeInTheDocument()

    const lockedPt = document.querySelector('[data-tree-level="prep-test"][data-explanation-locked="true"]')
    expect(lockedPt).toBeTruthy()
    expect(lockedPt?.querySelector("[data-explanation-lock-badge]")).toBeTruthy()
    // PrepTest rows use the leading lock only — no trailing status lock duplicate.
    expect(lockedPt?.querySelectorAll("[data-explanation-locked-status]")).toHaveLength(0)

    const pt159 = screen.getByRole("button", { name: /PT - 159/i })
    await user.click(pt159)
    await user.click(screen.getByRole("button", { name: /Section 1/i }))

    const sectionRow = document.querySelector('[data-tree-level="section"]')
    expect(sectionRow?.querySelector("[data-explanation-locked-status]")).toBeTruthy()

    const lockedQuestion = await screen.findByRole("button", { name: /PT159\.S1\.Q1/i })
    expect(lockedQuestion.closest("[data-explanation-locked='true']")).toBeTruthy()

    await user.click(lockedQuestion)
    expect(openLockedContentModal).toHaveBeenCalledWith("explanations")
  })
})

describe("ExplanationsPage paid plan", () => {
  beforeEach(() => {
    openLockedContentModal.mockReset()
    entitlementMock.entitlement.accessState = "READY"
    entitlementMock.entitlement.hasActiveCore = true
    entitlementMock.isPaymentRequired = false
    entitlementMock.canAccessLsacContent = true
  })

  it("keeps unlocked PrepTest number badges for paid users", async () => {
    renderPage()

    expect(await screen.findByText("LSAT Question Explanations")).toBeInTheDocument()
    expect(document.querySelector("[data-explanation-lock-badge]")).toBeNull()
    expect(document.querySelector('[data-explanation-locked="true"]')).toBeNull()
  })
})
