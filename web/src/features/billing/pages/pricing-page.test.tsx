import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PricingPage } from "./pricing-page"

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

function mockPricingCalls(checkoutResult: { data: unknown; error: unknown }) {
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
    if (functionName === "billing-create-checkout-session") {
      return Promise.resolve(checkoutResult)
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
    mockPricingCalls({ data: null, error: new Error("checkout unavailable") })
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
    mockPricingCalls({ data: null, error: new Error("should not run") })

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
})
