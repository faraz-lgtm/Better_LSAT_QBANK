import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { StudentAppSidebar } from "@/features/app-shell/student-app-sidebar"

const listCoursesMock = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { signOut: vi.fn() },
  }),
}))

vi.mock("@/lib/api/prep-course", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/prep-course")>("@/lib/api/prep-course")
  return {
    ...actual,
    createPrepCourseApi: () => ({
      listCourses: listCoursesMock,
    }),
  }
})

const sampleCourses = [
  {
    id: "c1",
    slug: "prep-course",
    title: "Essentials Course",
    description: null,
    is_published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "c2",
    slug: "betterlsat-core-syllabus",
    title: "BetterLSAT Core",
    description: null,
    is_published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

describe("StudentAppSidebar", () => {
  beforeEach(() => {
    listCoursesMock.mockReset()
    listCoursesMock.mockResolvedValue(sampleCourses)
  })

  it("shows all navigation links at once", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Diagnostic" })).toHaveAttribute("href", "/intent")
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

  it("marks Prep Course parent active and shows nested course links on prep-course routes", async () => {
    render(
      <MemoryRouter initialEntries={["/app/prep-course/prep-course"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("button", { name: /Prep Course/i })).toHaveClass("student-sidebar-link--active")
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveClass("student-sidebar-link--active")

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Essentials Course" })).toBeInTheDocument()
    })

    expect(screen.getByRole("link", { name: "Essentials Course" })).toHaveAttribute(
      "href",
      "/app/prep-course/prep-course",
    )
    expect(screen.getByRole("link", { name: "BetterLSAT Core" })).toHaveAttribute(
      "href",
      "/app/prep-course/betterlsat-core-syllabus",
    )
    expect(screen.getByRole("link", { name: "Essentials Course" })).toHaveClass("student-sidebar-link--active")
    expect(screen.getByRole("link", { name: "BetterLSAT Core" })).not.toHaveClass("student-sidebar-link--active")
  })

  it("expands Prep Course on toggle to reveal course names", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("link", { name: "Essentials Course" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Prep Course/i }))

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Essentials Course" })).toBeInTheDocument()
    })
    expect(screen.getByRole("link", { name: "BetterLSAT Core" })).toBeInTheDocument()
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

  it("collapses to icon-only navigation and expands again from the toggle", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    const sidebar = screen.getByLabelText("Main navigation")

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }))

    expect(sidebar).toHaveClass("student-sidebar--collapsed")
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Expand sidebar" }))

    expect(sidebar).not.toHaveClass("student-sidebar--collapsed")
  })

  it("opens the sidebar when clicking the Prep Course icon while collapsed", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    const sidebar = screen.getByLabelText("Main navigation")
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }))
    await user.click(screen.getByRole("button", { name: "Prep Course" }))

    expect(sidebar).not.toHaveClass("student-sidebar--collapsed")
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Essentials Course" })).toBeInTheDocument()
    })
  })
})
