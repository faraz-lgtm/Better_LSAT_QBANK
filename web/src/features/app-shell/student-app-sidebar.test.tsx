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

const { startProduktlyTour } = vi.hoisted(() => ({
  startProduktlyTour: vi.fn(),
}))

vi.mock("@/lib/analytics/produktly", () => ({
  startProduktlyTour: (...args: unknown[]) => startProduktlyTour(...args),
}))

vi.mock("@/lib/analytics/produktly-widgets", () => ({
  PRODUKTLY_PRODUCT_TOUR_ID: 11289,
}))

describe("StudentAppSidebar", () => {
  it("shows premium navigation including diagnostic links", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("button", { name: "Get Started" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByText("DIAGNOSTIC")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Diagnostic Test" })).toHaveAttribute("href", "/intent")
    expect(screen.getByRole("button", { name: /Diagnostic Results/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Diagnostic Explanation" })).toHaveAttribute(
      "href",
      "/app/diagnostic/explanations",
    )
    expect(screen.getByText("ACADEMY")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Prep Courses" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Explanations" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Untimed Review" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument()
    expect(screen.getByText("COMMUNITY")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Feedback" })).toHaveAttribute("href", "/app/feedback")
    expect(screen.getByRole("link", { name: "Roadmap" })).toHaveAttribute("href", "/app/roadmap")

    const diagnosticHeading = screen.getByText("DIAGNOSTIC")
    const diagnosticTest = screen.getByRole("link", { name: "Diagnostic Test" })
    const results = screen.getByRole("button", { name: /Diagnostic Results/i })
    const explanation = screen.getByRole("link", { name: "Diagnostic Explanation" })
    expect(
      diagnosticHeading.compareDocumentPosition(diagnosticTest) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      results.compareDocumentPosition(explanation) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it("marks the dashboard link with the same active style as other items", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass("student-sidebar-link--active")
  })

  it("exposes stable Produktly data-tour-target hooks on brand, menu, and Explanations", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(container.querySelector('[data-tour-target="sidebar-brand"]')).toHaveClass(
      "student-sidebar-brand-row",
    )
    expect(container.querySelector('[data-tour-target="sidebar-menu"]')).toHaveClass(
      "student-sidebar-menu",
    )
    expect(screen.getByRole("link", { name: "Explanations" })).toHaveAttribute(
      "data-tour-target",
      "nav-explanations",
    )
    expect(container.querySelector('[data-tour-target="nav-preptest"]')).toHaveAttribute(
      "href",
      "/app/preptest",
    )
    expect(container.querySelector('[data-tour-target="nav-insights-preptest"]')).toHaveAttribute(
      "href",
      "/app/analytics/preptests",
    )
  })

  it("keeps nav-explanations on the locked free-plan Explanations button", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} lockPremiumNav />
      </MemoryRouter>,
    )

    expect(screen.getByRole("button", { name: "Explanations (locked)" })).toHaveAttribute(
      "data-tour-target",
      "nav-explanations",
    )
    expect(screen.queryByRole("link", { name: "Explanations" })).not.toBeInTheDocument()
  })

  it("places Get Started above MAIN and starts the Produktly tour", async () => {
    const user = userEvent.setup()
    const onMobileClose = vi.fn()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={onMobileClose} />
      </MemoryRouter>,
    )

    const getStarted = screen.getByRole("button", { name: "Get Started" })
    const mainHeading = screen.getByText("MAIN")
    const dashboard = screen.getByRole("link", { name: "Dashboard" })
    expect(
      getStarted.compareDocumentPosition(mainHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      mainHeading.compareDocumentPosition(dashboard) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(getStarted.querySelector('img[src="/nav/rocket.svg"]')).toBeTruthy()

    await user.click(getStarted)
    expect(startProduktlyTour).toHaveBeenCalledWith({
      tourId: 11289,
      clearProgress: true,
    })
    expect(onMobileClose).toHaveBeenCalled()
  })

  it("marks Prep Course parent active and shows nested course links on prep-course routes", () => {
    render(
      <MemoryRouter initialEntries={["/app/prep-course/betterlsat-core-syllabus-structure-content"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("button", { name: "Prep Courses" })).toHaveClass("student-sidebar-link--active")
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveClass("student-sidebar-link--active")

    expect(screen.getByRole("link", { name: "LSAT Essentials Course" })).toHaveAttribute(
      "href",
      "/app/prep-course/betterlsat-core-syllabus-structure-content",
    )
    expect(screen.getByRole("link", { name: "LR Mastery Course" })).toHaveAttribute(
      "href",
      "/app/prep-course/lr-mastery-course",
    )
    expect(screen.getByRole("link", { name: "RC Mastery Course" })).toHaveAttribute(
      "href",
      "/app/prep-course/rc-mastery",
    )
    expect(screen.getByRole("link", { name: "LSAT Essentials Course" })).toHaveClass(
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

    expect(screen.queryByRole("link", { name: "LSAT Essentials Course" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Prep Courses" }))

    expect(screen.getByRole("link", { name: "LSAT Essentials Course" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "LR Mastery Course" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "RC Mastery Course" })).toBeInTheDocument()
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

  it("inverts the brand logo in dark mode", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("img", { name: "betterLSAT" })).toHaveClass("dark:brightness-0", "dark:invert")
  })

  it("expands Diagnostic Results to Mini and Full Section history links", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("link", { name: "Mini" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Diagnostic Results/i }))
    expect(screen.getByRole("link", { name: "Mini" })).toHaveAttribute("href", "/app/diagnostic/results/mini")
    expect(screen.getByRole("link", { name: "Full Section" })).toHaveAttribute("href", "/app/diagnostic/results/full")
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
    const brandMark = container.querySelector(".student-sidebar-brand-mark")
    const brandLogo = screen.getByRole("img", { name: "betterLSAT" })

    expect(brandMark).toHaveAttribute("src", "/betterLSAT_icon.png")
    expect(brandMark).toHaveClass("hidden")
    expect(brandMark).not.toHaveClass("lg:block")
    expect(brandLogo).not.toHaveClass("lg:hidden")

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }))

    expect(sidebar).toHaveClass("student-sidebar--collapsed")
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Mini" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Expand sidebar" }))
    expect(sidebar).not.toHaveClass("student-sidebar--collapsed")
    expect(brandMark).toHaveClass("hidden")
    expect(brandMark).not.toHaveClass("lg:block")
    expect(brandLogo).not.toHaveClass("lg:hidden")
  })
})
