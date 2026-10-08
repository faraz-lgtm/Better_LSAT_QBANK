import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeAll, describe, expect, it } from "vitest"
import type { ReactNode } from "react"

import { GuestDiagnosticExamLayout } from "@/features/guest/diagnostic/guest-diagnostic-exam-layout"
import { getGuestDiagnosticTestConfig } from "@/features/guest/diagnostic/guest-diagnostic-test-config"
import { ThemeProvider } from "@/features/theme/theme-provider"

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderExam(ui: ReactNode) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/diagnostic/start"]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                {ui}
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe("GuestDiagnosticExamLayout exit warning", () => {
  beforeAll(() => {
    Element.prototype.scrollTo = () => undefined
  })

  it("warns on header close X and navigates to the platform on confirm", async () => {
    const user = userEvent.setup()
    const config = getGuestDiagnosticTestConfig("mini")

    renderExam(<GuestDiagnosticExamLayout config={config} interactive />)

    await user.click(screen.getByRole("button", { name: "Close exam" }))

    expect(screen.getByRole("dialog", { name: "Leave Diagnostic" })).toBeInTheDocument()
    expect(screen.getByTestId("location")).toHaveTextContent("/diagnostic/start")

    await user.click(screen.getByRole("button", { name: "Leave" }))

    expect(screen.getByTestId("location")).toHaveTextContent("/app")
  })

  it("warns on Save and exit and navigates to the platform on confirm", async () => {
    const user = userEvent.setup()
    const config = getGuestDiagnosticTestConfig("mini")

    renderExam(<GuestDiagnosticExamLayout config={config} interactive />)

    await user.click(screen.getByRole("button", { name: "More options" }))
    await user.click(screen.getByRole("button", { name: "Save and exit" }))

    expect(screen.getByRole("dialog", { name: "Leave Diagnostic" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Leave" }))

    expect(screen.getByTestId("location")).toHaveTextContent("/app")
  })

  it("warns on Exit without saving and navigates to the platform on confirm", async () => {
    const user = userEvent.setup()
    const config = getGuestDiagnosticTestConfig("mini")

    renderExam(<GuestDiagnosticExamLayout config={config} interactive />)

    await user.click(screen.getByRole("button", { name: "More options" }))
    await user.click(screen.getByRole("button", { name: "Exit without saving" }))

    expect(screen.getByRole("dialog", { name: "Exit Without Saving" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Exit Without Saving" }))

    expect(screen.getByTestId("location")).toHaveTextContent("/app")
  })
})
