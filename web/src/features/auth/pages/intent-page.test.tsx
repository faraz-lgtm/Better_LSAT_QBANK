import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { IntentPage } from "./intent-page"

const saveDiagnosticIntentMock = vi.fn()

vi.mock("@/lib/auth/diagnostic-intent", () => ({
  saveDiagnosticIntent: (...args: unknown[]) => saveDiagnosticIntentMock(...args),
}))

let latestLocation: ReturnType<typeof useLocation> | null = null

function LocationTracker() {
  latestLocation = useLocation()
  return null
}

describe("IntentPage", () => {
  beforeEach(() => {
    saveDiagnosticIntentMock.mockReset()
    latestLocation = null
  })

  it("navigates unauthenticated users to signup with intent state", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/intent"]}>
        <LocationTracker />
        <Routes>
          <Route path="/intent" element={<IntentPage isAuthenticated={false} />} />
          <Route path="/signup" element={<div data-testid="signup-page">signup</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /start full diagnostic/i }))

    expect(saveDiagnosticIntentMock).toHaveBeenCalledWith("quick")
    expect(screen.getByTestId("signup-page")).toBeInTheDocument()
    expect(latestLocation?.pathname).toBe("/signup")
    expect(latestLocation?.state).toEqual({ from: "intent", intent: "quick" })
  })

  it("navigates authenticated users to diagnostic start with intent query", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/intent"]}>
        <LocationTracker />
        <Routes>
          <Route path="/intent" element={<IntentPage isAuthenticated={true} />} />
          <Route path="/diagnostic/start" element={<div data-testid="diag-start">start</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /start full diagnostic/i }))

    expect(saveDiagnosticIntentMock).toHaveBeenCalledWith("quick")
    expect(screen.getByTestId("diag-start")).toBeInTheDocument()
    expect(latestLocation?.pathname).toBe("/diagnostic/start")
    expect(latestLocation?.search).toBe("?intent=quick")
  })

  it("hides sign in link for authenticated users", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={true} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument()
  })

  it("links back to the app home when authenticated", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={true} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute("href", "/app")
  })

  it("links back to the marketing home when unauthenticated", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={false} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute("href", "/")
  })

  it("offers Mini and Full cards without the 115-question exam", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={false} />
      </MemoryRouter>,
    )

    expect(screen.getByText("Mini", { selector: ".intent-card__name" })).toBeInTheDocument()
    expect(screen.getByText("Full", { selector: ".intent-card__name" })).toBeInTheDocument()
    expect(screen.queryByText("115q")).not.toBeInTheDocument()
  })
})
