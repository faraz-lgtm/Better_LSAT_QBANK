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
  it("shows premium navigation without diagnostic links", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Diagnostic" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Diagnostic Results/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Prep Course/i })).toBeInTheDocument()
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

  it("marks Prep Course parent active and shows nested course links on prep-course routes", () => {
    render(
      <MemoryRouter initialEntries={["/app/prep-course/betterlsat-core-syllabus-structure-content"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("button", { name: /Prep Course/i })).toHaveClass("student-sidebar-link--active")
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveClass("student-sidebar-link--active")

    expect(screen.getByRole("link", { name: "LSAT Essential Course" })).toHaveAttribute(
      "href",
      "/app/prep-course/betterlsat-core-syllabus-structure-content",
    )
    expect(screen.getByRole("link", { name: "LR Mastery Course" })).toHaveAttribute(
      "href",
      "/app/prep-course/lr-mastery-course",
    )
    expect(screen.getByRole("link", { name: "RC Mastery" })).toHaveAttribute(
      "href",
      "/app/prep-course/rc-mastery",
    )
    expect(screen.getByRole("link", { name: "LSAT Essential Course" })).toHaveClass(
      "student-sidebar-link--active",
    )
    expect(screen.getByRole("link", { name: "LR Mastery Course" })).not.toHaveClass(
      "student-sidebar-link--active",
    )
  })

  it("expands Prep Course on toggle to reveal course names", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("link", { name: "LSAT Essential Course" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Prep Course/i }))

    expect(screen.getByRole("link", { name: "LSAT Essential Course" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "LR Mastery Course" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "RC Mastery" })).toBeInTheDocument()
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

  it("expands Diagnostic Results to Mini and Full history links", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} showDiagnosticNav />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("link", { name: "Mini" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Diagnostic Results/i }))
    expect(screen.getByRole("link", { name: "Mini" })).toHaveAttribute("href", "/app/diagnostic/results/mini")
    expect(screen.getByRole("link", { name: "Full" })).toHaveAttribute("href", "/app/diagnostic/results/full")
  })

  it("collapses to icon rail and expands again", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    const sidebar = container.querySelector(".student-sidebar")
    expect(sidebar).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }))

    expect(sidebar).toHaveClass("student-sidebar--collapsed")
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Mini" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Expand sidebar" }))
    expect(sidebar).not.toHaveClass("student-sidebar--collapsed")
  })
})
