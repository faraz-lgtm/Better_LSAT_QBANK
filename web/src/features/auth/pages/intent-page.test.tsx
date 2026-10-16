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

    await user.click(screen.getByRole("button", { name: /start full section/i }))

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

    await user.click(screen.getByRole("button", { name: /start full section/i }))

    expect(saveDiagnosticIntentMock).toHaveBeenCalledWith("quick")
    expect(screen.getByTestId("diag-start")).toBeInTheDocument()
    expect(latestLocation?.pathname).toBe("/diagnostic/start")
    expect(latestLocation?.search).toBe("?intent=quick")
  })

  it("sends authenticated first-time users to onboarding after picking a diagnostic", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/intent"]}>
        <LocationTracker />
        <Routes>
          <Route
            path="/intent"
            element={<IntentPage isAuthenticated={true} requiresOnboarding={true} />}
          />
          <Route path="/onboarding" element={<div data-testid="onboarding-page">onboarding</div>} />
          <Route path="/diagnostic/start" element={<div data-testid="diag-start">start</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /start full section/i }))

    expect(saveDiagnosticIntentMock).toHaveBeenCalledWith("quick")
    expect(screen.getByTestId("onboarding-page")).toBeInTheDocument()
    expect(latestLocation?.pathname).toBe("/onboarding")
    expect(screen.queryByTestId("diag-start")).not.toBeInTheDocument()
  })

  it("hides sign in link for authenticated users", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={true} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument()
  })

  it("shows Upgrade CTA for free / guest accounts", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={false} showUpgradeCta={true} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "Upgrade now" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /\$124/i })).not.toBeInTheDocument()
  })

  it("opens pricing modal when authenticated free user clicks Upgrade now", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={true} showUpgradeCta={true} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: "Upgrade now" }))

    expect(screen.getByRole("dialog", { name: /pricing/i })).toBeInTheDocument()
  })

  it("hides Upgrade CTA for paid accounts", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={true} showUpgradeCta={false} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("link", { name: /upgrade/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /upgrade/i })).not.toBeInTheDocument()
  })

  it("links back to the platform dashboard when authenticated", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={true} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute("href", "/app")
  })

  it("links the BetterLSAT logo to the platform home page", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={true} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "betterLSAT home" })).toHaveAttribute("href", "/app")
  })

  it("links back to betterlsat.com when unauthenticated", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={false} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "https://betterlsat.com",
    )
  })

  it("offers Quick Baseline and Full Section cards without the 115-question exam", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={false} />
      </MemoryRouter>,
    )

    expect(screen.getByText("Quick Baseline", { selector: ".intent-card__name" })).toBeInTheDocument()
    expect(screen.getByText("Full Section", { selector: ".intent-card__name" })).toBeInTheDocument()
    expect(screen.queryByText("Full", { selector: ".intent-card__name" })).not.toBeInTheDocument()
  })

  it("shows the LSAC terms disclaimer underneath the cards", () => {
    render(
      <MemoryRouter>
        <IntentPage isAuthenticated={false} />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/BetterLSAT is an independent test-preparation company and is not affiliated with or endorsed by LSAC/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/All actual LSAT® content is used with the permission of Law School Admission Council/),
    ).toBeInTheDocument()
  })
})
