import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { StudentAppSidebar } from "@/features/app-shell/student-app-sidebar"

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { signOut: vi.fn() },
  }),
}))

describe("StudentAppSidebar", () => {
  it("keeps only one section expanded at a time", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    const academyButton = screen.getByRole("button", { name: /academy/i })
    const prepButton = screen.getByRole("button", { name: /^prep$/i })

    await user.click(academyButton)
    expect(screen.getByRole("link", { name: "Prep Course" })).toBeInTheDocument()

    await user.click(prepButton)
    expect(screen.queryByRole("link", { name: "Prep Course" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Drills" })).toBeInTheDocument()
  })

  it("shows active background on expanded section header", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    const academyButton = screen.getByRole("button", { name: /academy/i })
    expect(academyButton).not.toHaveClass("student-sidebar-section-btn--active")

    await user.click(academyButton)
    expect(academyButton).toHaveClass("student-sidebar-section-btn--active")
  })
})
