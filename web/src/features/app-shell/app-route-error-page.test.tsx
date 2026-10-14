import { render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppRouteErrorPage } from "./app-route-error-page"
import { CHUNK_LOAD_RELOAD_KEY } from "./app-route-error"

vi.mock("@/lib/analytics/posthog", () => ({
  captureException: vi.fn(),
}))

function ThrowingPage(): never {
  throw new TypeError(
    "Failed to fetch dynamically imported module: https://app.betterlsat.com/assets/guest-diagnostic-results-page.js",
  )
}

describe("AppRouteErrorPage", () => {
  beforeEach(() => {
    sessionStorage.setItem(CHUNK_LOAD_RELOAD_KEY, "1")
  })

  it("replaces the default unexpected-error screen", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <ThrowingPage />,
          errorElement: <AppRouteErrorPage />,
        },
      ],
      { initialEntries: ["/"] },
    )

    render(<RouterProvider router={router} />)

    expect(screen.queryByText(/Unexpected Application Error/i)).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Update available" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reload page" })).toBeInTheDocument()
  })
})
