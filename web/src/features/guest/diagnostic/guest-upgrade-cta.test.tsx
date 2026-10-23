import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GuestUpgradeCta } from "@/features/guest/diagnostic/guest-upgrade-cta"

const openPricingModal = vi.fn()

vi.mock("@/features/guest/pricing/guest-pricing-modal-provider", () => ({
  useGuestPricingModal: () => ({
    openPricingModal,
    openLockedContentModal: vi.fn(),
    closePricingModal: vi.fn(),
  }),
}))

const entitlementState = vi.hoisted(() => ({
  value: null as null | {
    canAccessLsacContent: boolean
    isLsacSetupRequired: boolean
    isPaymentRequired: boolean
  },
}))

vi.mock("@/features/app-shell/student-entitlement-context", () => ({
  useStudentEntitlementOptional: () => entitlementState.value,
}))

function PathProbe() {
  const { pathname } = useLocation()
  return <div data-testid="path">{pathname}</div>
}

describe("GuestUpgradeCta", () => {
  beforeEach(() => {
    openPricingModal.mockReset()
    entitlementState.value = null
  })

  it("opens the pricing modal for free users", async () => {
    const user = userEvent.setup()
    entitlementState.value = {
      canAccessLsacContent: false,
      isLsacSetupRequired: false,
      isPaymentRequired: true,
    }

    render(
      <MemoryRouter>
        <GuestUpgradeCta />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: "Upgrade to LSAT" }))
    expect(openPricingModal).toHaveBeenCalledTimes(1)
  })

  it("navigates to LSAC link step when Core is active but LawHub is not linked", async () => {
    const user = userEvent.setup()
    entitlementState.value = {
      canAccessLsacContent: false,
      isLsacSetupRequired: true,
      isPaymentRequired: false,
    }

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route
            path="/app"
            element={
              <>
                <GuestUpgradeCta />
                <PathProbe />
              </>
            }
          />
          <Route path="/app/lsac-link-step" element={<PathProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: "Link LSAC" }))
    expect(openPricingModal).not.toHaveBeenCalled()
    expect(screen.getByTestId("path")).toHaveTextContent("/app/lsac-link-step")
  })

  it("hides when the student is already LSAC eligible", () => {
    entitlementState.value = {
      canAccessLsacContent: true,
      isLsacSetupRequired: false,
      isPaymentRequired: false,
    }

    render(
      <MemoryRouter>
        <GuestUpgradeCta />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("button", { name: /Upgrade to LSAT|Link LSAC/ })).toBeNull()
  })
})
