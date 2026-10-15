import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  GuestPricingModalProvider,
  useGuestPricingModal,
} from "@/features/guest/pricing/guest-pricing-modal-provider"

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
  const { pathname, search } = useLocation()
  return (
    <>
      <div data-testid="path">{pathname}</div>
      <div data-testid="search">{search}</div>
    </>
  )
}

function LockedContentTriggers() {
  const { openLockedContentModal } = useGuestPricingModal()
  return (
    <button type="button" onClick={openLockedContentModal}>
      Open locked
    </button>
  )
}

function ProviderHarness() {
  const [, setTick] = useState(0)
  return (
    <>
      <button type="button" onClick={() => setTick((n) => n + 1)}>
        Sync entitlement
      </button>
      <GuestPricingModalProvider authenticatedCheckout>
        <Routes>
          <Route
            path="/app"
            element={
              <>
                <LockedContentTriggers />
                <PathProbe />
              </>
            }
          />
          <Route path="/app/lsac-link-step" element={<PathProbe />} />
        </Routes>
      </GuestPricingModalProvider>
    </>
  )
}

describe("GuestPricingModalProvider", () => {
  beforeEach(() => {
    entitlementState.value = null
  })

  it("opens the pricing modal from ?upgrade=1 and strips the query", async () => {
    entitlementState.value = {
      canAccessLsacContent: false,
      isLsacSetupRequired: false,
      isPaymentRequired: true,
    }

    render(
      <MemoryRouter initialEntries={["/app?upgrade=1"]}>
        <ProviderHarness />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole("dialog", { name: /every paid plan includes the full platform/i }),
    ).toBeInTheDocument()
    expect(screen.getByTestId("path")).toHaveTextContent("/app")
    expect(screen.getByTestId("search")).toHaveTextContent("")
  })

  it("opens the locked-content modal for free users", async () => {
    const user = userEvent.setup()
    entitlementState.value = {
      canAccessLsacContent: false,
      isLsacSetupRequired: false,
      isPaymentRequired: true,
    }

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <ProviderHarness />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: "Open locked" }))
    expect(screen.getByRole("dialog", { name: "Subscriber-Only Content" })).toBeInTheDocument()
    expect(screen.getByTestId("path")).toHaveTextContent("/app")
  })

  it("opens locked content by navigating to the LSAC link step when setup is required", async () => {
    const user = userEvent.setup()
    entitlementState.value = {
      canAccessLsacContent: false,
      isLsacSetupRequired: true,
      isPaymentRequired: false,
    }

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <ProviderHarness />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: "Open locked" }))

    expect(screen.queryByRole("dialog", { name: "Subscriber-Only Content" })).not.toBeInTheDocument()
    expect(screen.getByTestId("path")).toHaveTextContent("/app/lsac-link-step")
  })

  it("sends Subscribe Now to the LSAC link step when setup becomes required", async () => {
    const user = userEvent.setup()
    entitlementState.value = {
      canAccessLsacContent: false,
      isLsacSetupRequired: false,
      isPaymentRequired: true,
    }

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <ProviderHarness />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: "Open locked" }))
    expect(screen.getByRole("dialog", { name: "Subscriber-Only Content" })).toBeInTheDocument()

    entitlementState.value = {
      canAccessLsacContent: false,
      isLsacSetupRequired: true,
      isPaymentRequired: false,
    }
    await user.click(screen.getByRole("button", { name: "Sync entitlement" }))
    await user.click(screen.getByRole("button", { name: "Subscribe Now" }))

    expect(screen.queryByRole("dialog", { name: "Subscriber-Only Content" })).not.toBeInTheDocument()
    expect(screen.getByTestId("path")).toHaveTextContent("/app/lsac-link-step")
  })
})
