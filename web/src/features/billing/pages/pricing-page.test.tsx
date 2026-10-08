import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PricingPage } from "./pricing-page"

function LocationProbe() {
  const location = useLocation()
  return <p>{`${location.pathname}${location.search}`}</p>
}

const authMock = {
  getSession: vi.fn(),
}
const invokeMock = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: authMock,
    functions: { invoke: invokeMock },
  }),
}))

const profile = {
  id: "u1",
  email: "buyer@example.com",
  first_name: "Ada",
  last_name: "Lovelace",
  role: "student",
  is_first_time_login: false,
}

function mockPricingCalls() {
  invokeMock.mockImplementation((functionName: string) => {
    if (functionName === "users") {
      return Promise.resolve({ data: { profile }, error: null })
    }
    if (functionName === "users-get-entitlement-state") {
      return Promise.resolve({
        data: {
          entitlement: {
            accessState: "PAYMENT_REQUIRED",
            hasActiveCore: false,
          },
        },
        error: null,
      })
    }
    if (functionName === "billing-get-plans") {
      return Promise.resolve({
        data: {
          catalog: {
            plans: [],
            lsacYearly: { name: "LawHub", description: "", yearlyUsd: 120 },
          },
        },
        error: null,
      })
    }
    throw new Error(`Unexpected function: ${functionName}`)
  })
}

describe("PricingPage selected checkout", () => {
  beforeEach(() => {
    authMock.getSession.mockReset()
    authMock.getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
    })
    invokeMock.mockReset()
    window.localStorage.clear()
  })

  it("does not auto-start checkout from a plan query", async () => {
    mockPricingCalls()
    window.localStorage.setItem(
      "betterlsat:pending-checkout-plan",
      "three_month",
    )

    render(
      <MemoryRouter initialEntries={["/app/pricing?plan=three_month"]}>
        <PricingPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole("heading", { name: /pricing/i })).toBeInTheDocument()
    expect(
      invokeMock.mock.calls.some(
        ([functionName]) => functionName === "billing-create-checkout-session",
      ),
    ).toBe(false)
    expect(
      window.localStorage.getItem("betterlsat:pending-checkout-plan"),
    ).toBe("three_month")
  })

  it("ignores unsupported plan query values", async () => {
    mockPricingCalls()

    render(
      <MemoryRouter initialEntries={["/app/pricing?plan=twelve_month"]}>
        <PricingPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole("heading", { name: /pricing/i })).toBeInTheDocument()
    expect(
      invokeMock.mock.calls.some(
        ([functionName]) => functionName === "billing-create-checkout-session",
      ),
    ).toBe(false)
  })

  it("routes paid plan CTAs to the checkout handoff", async () => {
    const user = userEvent.setup()
    mockPricingCalls()

    render(
      <MemoryRouter initialEntries={["/app/pricing"]}>
        <Routes>
          <Route path="/app/pricing" element={<PricingPage />} />
          <Route path="/checkout" element={<p>Checkout handoff view</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole("button", { name: /choose 3 months/i }))

    expect(await screen.findByText(/checkout handoff view/i)).toBeInTheDocument()
    expect(
      invokeMock.mock.calls.some(
        ([functionName]) => functionName === "billing-create-checkout-session",
      ),
    ).toBe(false)
  })

  it("passes includeLawHub=0 when Core-only mode is selected", async () => {
    const user = userEvent.setup()
    mockPricingCalls()

    render(
      <MemoryRouter initialEntries={["/app/pricing"]}>
        <Routes>
          <Route path="/app/pricing" element={<PricingPage />} />
          <Route path="/checkout" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(
      await screen.findByRole("button", {
        name: /i already have lawhub prepplus — pay for core only/i,
      }),
    )
    await user.click(await screen.findByRole("button", { name: /choose monthly/i }))

    expect(await screen.findByText("/checkout?plan=monthly&includeLawHub=0")).toBeInTheDocument()
  })
})
