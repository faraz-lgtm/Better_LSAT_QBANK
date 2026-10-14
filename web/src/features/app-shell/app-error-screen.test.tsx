import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AppErrorScreen } from "./app-error-screen"
import { CHUNK_LOAD_RELOAD_KEY } from "./app-route-error"

vi.mock("@/lib/analytics/posthog", () => ({
  captureException: vi.fn(),
}))

describe("AppErrorScreen", () => {
  const originalLocation = window.location

  beforeEach(() => {
    sessionStorage.clear()
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        reload: vi.fn(),
        assign: vi.fn(),
      },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    })
    sessionStorage.clear()
  })

  it("renders generic recovery actions", async () => {
    const user = userEvent.setup()
    render(<AppErrorScreen error={new Error("boom")} showDetails={false} />)

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(window.location.reload).toHaveBeenCalledOnce()

    await user.click(screen.getByRole("button", { name: "Go to dashboard" }))
    expect(window.location.assign).toHaveBeenCalledWith("/app")
  })

  it("auto-reloads once for chunk-load failures", () => {
    render(
      <AppErrorScreen
        error={
          new TypeError(
            "Failed to fetch dynamically imported module: https://app.betterlsat.com/assets/guest-diagnostic-results-page.js",
          )
        }
        showDetails={false}
      />,
    )

    expect(screen.getByText("Loading the latest version…")).toBeInTheDocument()
    expect(window.location.reload).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem(CHUNK_LOAD_RELOAD_KEY)).toBe("1")
  })

  it("shows update copy when auto-reload already ran", () => {
    sessionStorage.setItem(CHUNK_LOAD_RELOAD_KEY, "1")
    render(
      <AppErrorScreen
        error={new TypeError("Failed to fetch dynamically imported module: x.js")}
        showDetails={false}
      />,
    )

    expect(window.location.reload).not.toHaveBeenCalled()
    expect(screen.getByRole("heading", { name: "Update available" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reload page" })).toBeInTheDocument()
  })

  it("shows details when requested", () => {
    render(<AppErrorScreen error={new Error("secret stack")} showDetails />)
    expect(screen.getByTestId("app-error-details")).toHaveTextContent("secret stack")
  })
})
