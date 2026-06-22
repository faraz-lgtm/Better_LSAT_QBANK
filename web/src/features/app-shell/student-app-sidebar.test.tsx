import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { StudentAppSidebar } from "@/features/app-shell/student-app-sidebar"

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { signOut: vi.fn() },
  }),
}))

describe("StudentAppSidebar", () => {
  it("shows all navigation links at once", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Prep Course" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Explanations" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Blind Review" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument()
  })

  it("marks the dashboard link with the same active style as other items", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass("student-sidebar-link--active")
  })

  it("marks nested links with the sub-item active style", () => {
    render(
      <MemoryRouter initialEntries={["/app/prep-course"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "Prep Course" })).toHaveClass("student-sidebar-link--active")
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveClass("student-sidebar-link--active")
  })

  it("shows logout and version in the footer", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument()
    expect(screen.getByText("Version 1.0.3")).toBeInTheDocument()
  })
})
