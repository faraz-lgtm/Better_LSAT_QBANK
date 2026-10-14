import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { CheckoutPaymentSuccessDialog } from "./checkout-payment-success-dialog"

function LocationProbe() {
  const { pathname, search } = useLocation()
  return <div data-testid="location">{`${pathname}${search}`}</div>
}

describe("CheckoutPaymentSuccessDialog", () => {
  it("opens on checkout=success and clears success params on dismiss", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/app/lsac-link-step?checkout=success&session_id=cs_123"]}>
        <Routes>
          <Route
            path="/app/lsac-link-step"
            element={
              <>
                <CheckoutPaymentSuccessDialog />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: /payment successful/i })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /continue/i }))
    expect(screen.queryByRole("heading", { name: /payment successful/i })).not.toBeInTheDocument()
    expect(screen.getByTestId("location")).toHaveTextContent("/app/lsac-link-step")
  })

  it("does not open without a success query", () => {
    render(
      <MemoryRouter initialEntries={["/app/lsac-link-step"]}>
        <CheckoutPaymentSuccessDialog />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("heading", { name: /payment successful/i })).not.toBeInTheDocument()
  })
})
