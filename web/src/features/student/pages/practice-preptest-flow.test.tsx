import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { PracticePrepTestPage } from "@/features/student/pages/practice-preptest-page"
import { PracticePrepTestSectionPage } from "@/features/student/pages/practice-preptest-section-page"

function renderPrepTestRoutes(initialPath: string) {
  const router = createMemoryRouter(
    [
      { path: "/app/practice/preptest/:testId", element: <PracticePrepTestPage /> },
      {
        path: "/app/practice/preptest/:testId/section/:sectionId",
        element: <PracticePrepTestSectionPage />,
      },
    ],
    { initialEntries: [initialPath] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe("PracticePrepTestPage + section navigation", () => {
  it("shows hub content for testId and navigates to section on Start Section", async () => {
    const user = userEvent.setup()
    const router = renderPrepTestRoutes("/app/practice/preptest/pt145")

    expect(await screen.findByRole("heading", { name: /Ready to begin your test/i })).toBeInTheDocument()
    expect(within(screen.getByRole("main")).getByText("PT 145")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Test Section/i })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Start Section/i }))

    expect(router.state.location.pathname).toBe("/app/practice/preptest/pt145/section/s1")
    expect(await screen.findByText(/Section timer/i)).toBeInTheDocument()
    expect(screen.getByText(/Philosopher:/)).toBeInTheDocument()
  })
})
