import { StrictMode } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CheckoutDetailsPage } from "./checkout-details-page"
import { CheckoutPage } from "./checkout-page"

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

const completeProfile = {
  id: "u1",
  email: "buyer@example.com",
  full_name: "Ada Lovelace",
  first_name: "Ada",
  last_name: "Lovelace",
  phone: null,
  role: "student",
  is_first_time_login: true,
  student_coaching_id: null,
  created_at: "",
  updated_at: "",
}

describe("direct checkout flow", () => {
  beforeEach(() => {
    authMock.getSession.mockReset()
    authMock.getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
    })
    invokeMock.mockReset()
    window.localStorage.clear()
  })

  it("keeps onboarding pending and creates one checkout session in StrictMode", async () => {
    invokeMock.mockImplementation((functionName: string, options?: { body?: { action?: string } }) => {
      if (functionName === "users" && options?.body?.action === "users-complete-first-login") {
        return Promise.resolve({
          data: { profile: { ...completeProfile, is_first_time_login: false } },
          error: null,
        })
      }
      if (functionName === "users") {
        return Promise.resolve({
          data: { profile: { ...completeProfile, email: null } },
          error: null,
        })
      }
      if (functionName === "billing-create-checkout-session") {
        return Promise.resolve({ data: null, error: new Error("checkout unavailable") })
      }
      throw new Error(`Unexpected function: ${functionName}`)
    })

    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/checkout?plan=monthly"]}>
          <CheckoutPage />
        </MemoryRouter>
      </StrictMode>,
    )

    await waitFor(() => {
      expect(
        invokeMock.mock.calls.filter(
          ([functionName]) => functionName === "billing-create-checkout-session",
        ),
      ).toHaveLength(1)
    })
    const checkoutCall = invokeMock.mock.calls.find(
      ([functionName]) => functionName === "billing-create-checkout-session",
    )
    expect(checkoutCall?.[1]?.body).toEqual(
      expect.objectContaining({
        plan: "monthly",
        successPath: "/onboarding?checkout=success",
      }),
    )
    expect(
      invokeMock.mock.calls.some(
        ([functionName, options]) =>
          functionName === "users" &&
          options?.body?.action === "users-complete-first-login",
      ),
    ).toBe(false)
  })

  it("sends profiles without a complete name to the minimal details step", async () => {
    invokeMock.mockResolvedValue({
      data: {
        profile: {
          ...completeProfile,
          full_name: null,
          first_name: null,
          last_name: null,
        },
      },
      error: null,
    })

    render(
      <MemoryRouter initialEntries={["/checkout?plan=three_month"]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/details" element={<p>Name details view</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/name details view/i)).toBeInTheDocument()
    expect(
      invokeMock.mock.calls.some(
        ([functionName]) => functionName === "billing-create-checkout-session",
      ),
    ).toBe(false)
  })

  it("does not restart checkout automatically after Stripe cancellation", async () => {
    render(
      <MemoryRouter initialEntries={["/checkout?plan=six_month&checkout=cancel"]}>
        <CheckoutPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole("heading", { name: /checkout canceled/i })).toBeInTheDocument()
    expect(invokeMock).not.toHaveBeenCalled()
  })

  it("saves required names and continues to checkout", async () => {
    const user = userEvent.setup()
    const profileWithoutName = {
      ...completeProfile,
      full_name: null,
      first_name: null,
      last_name: null,
    }
    invokeMock.mockImplementation((functionName: string, options?: { body?: { action?: string } }) => {
      if (functionName !== "users") throw new Error(`Unexpected function: ${functionName}`)
      if (options?.body?.action === "users-update-account-profile") {
        return Promise.resolve({ data: { profile: completeProfile }, error: null })
      }
      if (options?.body?.action === "users-complete-first-login") {
        return Promise.resolve({
          data: { profile: { ...completeProfile, is_first_time_login: false } },
          error: null,
        })
      }
      return Promise.resolve({ data: { profile: profileWithoutName }, error: null })
    })

    render(
      <MemoryRouter initialEntries={["/checkout/details?plan=monthly"]}>
        <Routes>
          <Route path="/checkout/details" element={<CheckoutDetailsPage />} />
          <Route path="/checkout" element={<p>Checkout handoff view</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(await screen.findByLabelText(/first name/i), "Ada")
    await user.type(screen.getByLabelText(/last name/i), "Lovelace")
    await user.click(screen.getByRole("button", { name: /continue to checkout/i }))

    expect(await screen.findByText(/checkout handoff view/i)).toBeInTheDocument()
    expect(
      invokeMock.mock.calls.some(
        ([functionName, options]) =>
          functionName === "users" &&
          options?.body?.action === "users-update-account-profile",
      ),
    ).toBe(true)
    expect(
      invokeMock.mock.calls.some(
        ([functionName, options]) =>
          functionName === "users" &&
          options?.body?.action === "users-complete-first-login",
      ),
    ).toBe(false)
  })
})
